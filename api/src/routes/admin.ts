import { Router, Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';
import { sendTextMessage } from '../services/whatsapp';

const router = Router();

// ── Admin auth middleware ─────────────────────────────────────

function requireAdminSecret(req: Request, res: Response, next: NextFunction): void {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

router.use(requireAdminSecret);

// ─────────────────────────────────────────────────────────────
// GET /api/admin/stats
// ─────────────────────────────────────────────────────────────

router.get('/stats', async (_req, res) => {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    // Run all queries in parallel
    const [
      leadsThisMonth,
      leadsLastMonth,
      leadsConverted,
      leadsTotal,
      revenueResult,
      activeTherapists,
      pendingAppointments,
      avgResponseResult,
      weeklyLeads,
      recentLeads,
    ] = await Promise.all([
      // Leads this month
      supabaseAdmin.from('leads').select('id', { count: 'exact', head: true })
        .gte('created_at', thisMonthStart),

      // Leads last month
      supabaseAdmin.from('leads').select('id', { count: 'exact', head: true })
        .gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd),

      // Converted leads (all time for rate)
      supabaseAdmin.from('leads').select('id', { count: 'exact', head: true })
        .eq('status', 'converted'),

      // Total leads
      supabaseAdmin.from('leads').select('id', { count: 'exact', head: true }),

      // Revenue this month
      supabaseAdmin.from('payments')
        .select('amount_cents')
        .eq('status', 'succeeded')
        .gte('created_at', thisMonthStart),

      // Active therapists
      supabaseAdmin.from('therapists').select('id', { count: 'exact', head: true })
        .eq('is_active', true),

      // Pending appointments
      supabaseAdmin.from('appointments').select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),

      // Avg response time: avg of (first_message_at - created_at) in minutes
      supabaseAdmin.from('leads')
        .select('created_at, first_message_sent_at')
        .not('first_message_sent_at', 'is', null)
        .limit(200),

      // Weekly leads for last 8 weeks
      supabaseAdmin.from('leads')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString()),

      // Recent 10 leads
      supabaseAdmin.from('leads')
        .select('id, full_name, status, source, created_at, therapists(full_name)')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    // Compute revenue
    const revenueCents = (revenueResult.data ?? []).reduce(
      (sum: number, p: { amount_cents: number }) => sum + (p.amount_cents ?? 0), 0
    );

    // Compute avg response time
    const times = (avgResponseResult.data ?? []).map((l: { created_at: string; first_message_sent_at: string }) => {
      const diff = new Date(l.first_message_sent_at).getTime() - new Date(l.created_at).getTime();
      return diff / 60000; // ms → minutes
    }).filter((t: number) => t > 0 && t < 1440); // ignore >24h outliers
    const avgResponseMin = times.length
      ? Math.round(times.reduce((a: number, b: number) => a + b, 0) / times.length)
      : null;

    // Bucket weekly leads
    const weekBuckets: Record<string, number> = {};
    for (let i = 7; i >= 0; i--) {
      const d = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
      const key = `W${8 - i}`; // W1 = oldest
      weekBuckets[key] = 0;
    }
    (weeklyLeads.data ?? []).forEach((l: { created_at: string }) => {
      const weeksAgo = Math.floor(
        (Date.now() - new Date(l.created_at).getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      if (weeksAgo < 8) {
        const key = `W${8 - weeksAgo}`;
        weekBuckets[key] = (weekBuckets[key] ?? 0) + 1;
      }
    });
    const weeklyData = Object.entries(weekBuckets).map(([week, count]) => ({ week, count }));

    // % change leads month-over-month
    const thisCount = leadsThisMonth.count ?? 0;
    const lastCount = leadsLastMonth.count ?? 1;
    const momChange = Math.round(((thisCount - lastCount) / lastCount) * 100);

    res.json({
      leads_this_month: thisCount,
      leads_last_month: lastCount,
      leads_mom_change_pct: momChange,
      conversion_rate: leadsTotal.count
        ? Math.round(((leadsConverted.count ?? 0) / leadsTotal.count) * 100)
        : 0,
      revenue_this_month_cents: revenueCents,
      active_therapists: activeTherapists.count ?? 0,
      pending_appointments: pendingAppointments.count ?? 0,
      avg_response_min: avgResponseMin,
      weekly_leads: weeklyData,
      recent_leads: recentLeads.data ?? [],
    });
  } catch (err) {
    logger.error('admin/stats error', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/leads
// ─────────────────────────────────────────────────────────────

router.get('/leads', async (req, res) => {
  try {
    const page   = parseInt(req.query.page as string) || 1;
    const limit  = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string | undefined;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('leads')
      .select(`
        id, full_name, phone, whatsapp_number, email, status, source,
        country, city, concern, created_at, updated_at,
        voice_call_summary, first_message_sent_at,
        therapists(id, full_name),
        conversations(id, direction, channel, body, created_at)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({ leads: data ?? [], total: count ?? 0, page, limit });
  } catch (err) {
    logger.error('admin/leads error', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/leads/:id
// ─────────────────────────────────────────────────────────────

const LEAD_PATCHABLE = new Set([
  'status', 'matched_therapist_id', 'concern', 'notes',
]);

router.patch('/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates: Record<string, unknown> = {};
    for (const key of Object.keys(req.body)) {
      if (LEAD_PATCHABLE.has(key)) updates[key] = req.body[key];
    }
    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }
    const { data, error } = await supabaseAdmin
      .from('leads').update(updates).eq('id', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    logger.error('admin/leads/:id patch error', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/admin/leads/:id/message  — send manual WA message
// ─────────────────────────────────────────────────────────────

router.post('/leads/:id/message', async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req.body as { body: string };
    if (!body?.trim()) { res.status(400).json({ error: 'body required' }); return; }

    const { data: lead, error } = await supabaseAdmin
      .from('leads').select('whatsapp_number, phone').eq('id', id).single();
    if (error || !lead) { res.status(404).json({ error: 'Lead not found' }); return; }

    const to = (lead.whatsapp_number ?? lead.phone) as string;
    await sendTextMessage(to, body);

    await supabaseAdmin.from('conversations').insert({
      lead_id: id, direction: 'outbound', channel: 'whatsapp', body,
    });

    res.json({ ok: true });
  } catch (err) {
    logger.error('admin/leads/:id/message error', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/therapists
// ─────────────────────────────────────────────────────────────

router.get('/therapists', async (_req, res) => {
  try {
    const thisMonthStart = new Date(
      new Date().getFullYear(), new Date().getMonth(), 1
    ).toISOString();

    const { data: therapists, error } = await supabaseAdmin
      .from('therapists')
      .select('*')
      .order('full_name');
    if (error) throw error;

    // Session counts this month per therapist
    const { data: sessions } = await supabaseAdmin
      .from('appointments')
      .select('therapist_id')
      .in('status', ['confirmed', 'completed'])
      .gte('created_at', thisMonthStart);

    // Revenue per therapist
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('therapist_id, platform_fee_cents')
      .eq('status', 'succeeded')
      .gte('created_at', thisMonthStart);

    const sessionMap: Record<string, number> = {};
    (sessions ?? []).forEach((s: { therapist_id: string }) => {
      sessionMap[s.therapist_id] = (sessionMap[s.therapist_id] ?? 0) + 1;
    });

    const revenueMap: Record<string, number> = {};
    (payments ?? []).forEach((p: { therapist_id: string; platform_fee_cents: number }) => {
      revenueMap[p.therapist_id] = (revenueMap[p.therapist_id] ?? 0) + (p.platform_fee_cents ?? 0);
    });

    const enriched = (therapists ?? []).map((t: Record<string, unknown>) => ({
      ...t,
      sessions_this_month: sessionMap[t.id as string] ?? 0,
      revenue_this_month_cents: revenueMap[t.id as string] ?? 0,
    }));

    res.json({ therapists: enriched });
  } catch (err) {
    logger.error('admin/therapists error', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/therapists/:id
// ─────────────────────────────────────────────────────────────

const THERAPIST_PATCHABLE = new Set([
  'is_active', 'tier', 'session_rate_cents', 'bio', 'specialties',
  'languages', 'experience_years', 'whatsapp_number',
]);

router.patch('/therapists/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates: Record<string, unknown> = {};
    for (const key of Object.keys(req.body)) {
      if (THERAPIST_PATCHABLE.has(key)) updates[key] = req.body[key];
    }
    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }
    const { data, error } = await supabaseAdmin
      .from('therapists').update(updates).eq('id', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    logger.error('admin/therapists/:id patch error', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
