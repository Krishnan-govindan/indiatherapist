// ─────────────────────────────────────────────────────────────
// Admin WhatsApp API Routes
//
// Mount: app.use('/api/admin/whatsapp', adminWhatsappRouter)
// Auth: Uses same requireAdminSecret middleware as /api/admin
// ─────────────────────────────────────────────────────────────

import { Router, Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';
import { sendTextMessage } from '../services/whatsapp';

const router = Router();

// ── Admin auth middleware (same pattern as admin.ts) ─────────

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
// GET /conversations
// Returns leads with latest message, session state, unread count
// ─────────────────────────────────────────────────────────────

router.get('/conversations', async (req: Request, res: Response) => {
  try {
    const filter = (req.query.filter as string) ?? 'all';
    const search = (req.query.search as string) ?? '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Get leads that have at least one conversation
    let query = supabaseAdmin
      .from('leads')
      .select(`
        id, full_name, phone, whatsapp_number, email, country, status, created_at,
        ai_agent_sessions (
          id, session_state, escalated_to_human, current_therapist_id, payment_link, created_at, updated_at
        )
      `)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,whatsapp_number.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: leads, error } = await query;

    if (error) {
      logger.error('GET /conversations failed', { error: error.message });
      res.status(500).json({ error: error.message });
      return;
    }

    // For each lead, get latest message and unread count
    const enriched = await Promise.all(
      (leads ?? []).map(async (lead: Record<string, unknown>) => {
        // Latest message
        const { data: lastMsg } = await supabaseAdmin
          .from('conversations')
          .select('message_body, direction, created_at, ai_generated')
          .eq('lead_id', lead.id as string)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Unread count (inbound messages since last outbound)
        const { count: unreadCount } = await supabaseAdmin
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .eq('lead_id', lead.id as string)
          .eq('direction', 'inbound')
          .eq('channel', 'whatsapp')
          .gt(
            'created_at',
            // Find last outbound message time
            (await supabaseAdmin
              .from('conversations')
              .select('created_at')
              .eq('lead_id', lead.id as string)
              .eq('direction', 'outbound')
              .order('created_at', { ascending: false })
              .limit(1)
              .single()
            ).data?.created_at ?? '1970-01-01T00:00:00Z'
          );

        const sessions = lead.ai_agent_sessions as Array<Record<string, unknown>> | null;
        const session = sessions?.[0] ?? null;
        const sessionState = (session?.session_state as string) ?? 'none';
        const escalated = (session?.escalated_to_human as boolean) ?? false;

        return {
          id: lead.id,
          full_name: lead.full_name,
          phone: lead.phone,
          whatsapp_number: lead.whatsapp_number,
          email: lead.email,
          country: lead.country,
          status: lead.status,
          session_state: sessionState,
          session_id: session?.id ?? null,
          escalated_to_human: escalated,
          last_message: lastMsg?.message_body ?? null,
          last_message_direction: lastMsg?.direction ?? null,
          last_message_time: lastMsg?.created_at ?? lead.created_at,
          last_message_ai: lastMsg?.ai_generated ?? false,
          unread_count: unreadCount ?? 0,
        };
      })
    );

    // Apply filter
    let filtered = enriched;
    switch (filter) {
      case 'active':
        filtered = enriched.filter(
          (c) => !['confirmed', 'escalated', 'none'].includes(c.session_state)
        );
        break;
      case 'pending':
        filtered = enriched.filter((c) => c.session_state === 'payment_sent');
        break;
      case 'escalated':
        filtered = enriched.filter(
          (c) => c.session_state === 'escalated' || c.escalated_to_human
        );
        break;
    }

    // Sort by last message time (most recent first)
    filtered.sort((a, b) => {
      const ta = new Date(a.last_message_time).getTime();
      const tb = new Date(b.last_message_time).getTime();
      return tb - ta;
    });

    res.json({ conversations: filtered, total: filtered.length });
  } catch (err) {
    logger.error('GET /conversations error', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /conversations/:leadId/messages
// Returns all conversations for a lead
// ─────────────────────────────────────────────────────────────

router.get('/conversations/:leadId/messages', async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;

    const { data: messages, error } = await supabaseAdmin
      .from('conversations')
      .select('id, direction, channel, message_body, media_url, ai_generated, ai_intent, created_at, from_number, to_number')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Also fetch lead context summary
    const { data: contextSummary } = await supabaseAdmin
      .from('lead_context_summaries')
      .select('summary, key_concerns, session_count, last_therapist')
      .eq('lead_id', leadId)
      .single();

    // Fetch lead details
    const { data: lead } = await supabaseAdmin
      .from('leads')
      .select('*, therapists:matched_therapist_id(full_name, specialties, session_rate_cents)')
      .eq('id', leadId)
      .single();

    // Fetch session
    const { data: session } = await supabaseAdmin
      .from('ai_agent_sessions')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    res.json({
      messages: messages ?? [],
      lead,
      session,
      context_summary: contextSummary,
    });
  } catch (err) {
    logger.error('GET /conversations/:leadId/messages error', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /send
// Admin sends a manual message to a lead
// ─────────────────────────────────────────────────────────────

router.post('/send', async (req: Request, res: Response) => {
  try {
    const { leadId, message } = req.body;

    if (!leadId || !message) {
      res.status(400).json({ error: 'leadId and message are required' });
      return;
    }

    const { data: lead, error: leadErr } = await supabaseAdmin
      .from('leads')
      .select('id, whatsapp_number, full_name')
      .eq('id', leadId)
      .single();

    if (leadErr || !lead?.whatsapp_number) {
      res.status(404).json({ error: 'Lead not found or missing WhatsApp number' });
      return;
    }

    // Send via Meta Cloud API
    await sendTextMessage(lead.whatsapp_number, message);

    // Log to conversations
    await supabaseAdmin.from('conversations').insert({
      lead_id: leadId,
      channel: 'whatsapp',
      direction: 'outbound',
      from_number: '+18568782862',
      to_number: lead.whatsapp_number,
      message_body: message,
      ai_generated: false,
      ai_intent: 'admin_manual',
    });

    logger.info('Admin sent manual message', { leadId, to: lead.whatsapp_number });
    res.json({ success: true });
  } catch (err) {
    logger.error('POST /send error', { error: (err as Error).message });
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /sessions/:sessionId/ai-toggle
// Toggle AI on/off for a conversation
// ─────────────────────────────────────────────────────────────

router.patch('/sessions/:sessionId/ai-toggle', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { aiEnabled } = req.body;

    const escalated = !aiEnabled;

    const { data: session, error } = await supabaseAdmin
      .from('ai_agent_sessions')
      .update({
        escalated_to_human: escalated,
        session_state: escalated ? 'escalated' : 'greeting',
      })
      .eq('id', sessionId)
      .select('*')
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // If turning AI off, create escalation record
    if (escalated && session) {
      await supabaseAdmin.from('manual_escalations').insert({
        lead_id: session.lead_id,
        reason: 'admin_manual_takeover',
        status: 'pending',
        assigned_to: 'admin',
      });
    }

    logger.info('AI toggle updated', { sessionId, aiEnabled, escalated });
    res.json({ session });
  } catch (err) {
    logger.error('PATCH /sessions/:sessionId/ai-toggle error', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /stats
// WhatsApp dashboard stats
// ─────────────────────────────────────────────────────────────

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [totalConvos, activeToday, escalated, aiHandled] = await Promise.all([
      // Total conversations (leads with at least one message)
      supabaseAdmin
        .from('conversations')
        .select('lead_id', { count: 'exact', head: true })
        .not('lead_id', 'is', null),

      // Active today
      supabaseAdmin
        .from('conversations')
        .select('lead_id', { count: 'exact', head: true })
        .not('lead_id', 'is', null)
        .gte('created_at', oneDayAgo),

      // Escalated
      supabaseAdmin
        .from('ai_agent_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('escalated_to_human', true),

      // AI handled (last 7 days)
      supabaseAdmin
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('ai_generated', true)
        .eq('direction', 'outbound')
        .gte('created_at', sevenDaysAgo),
    ]);

    // Unread escalated count (for badge)
    const { count: unreadEscalated } = await supabaseAdmin
      .from('manual_escalations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    res.json({
      total_conversations: totalConvos.count ?? 0,
      active_today: activeToday.count ?? 0,
      escalated: escalated.count ?? 0,
      ai_handled: aiHandled.count ?? 0,
      unread_escalated: unreadEscalated ?? 0,
    });
  } catch (err) {
    logger.error('GET /stats error', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
