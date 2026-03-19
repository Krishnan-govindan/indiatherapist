import { Router, Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';
import { triggerOutboundCall } from '../services/voiceCaller';
import { sendTemplateMessage, sendTextMessage } from '../services/whatsapp';
import type { Lead } from '../lib/types';

const router = Router();

// ─────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Normalise a phone string to E.164 (+CountryCodeNumber).
 * Accepts: "+919876543210", "919876543210", "9876543210" (assumes +91 for 10-digit Indian numbers).
 * Returns null if the number can't be normalised.
 */
function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;

  // Already has country code (11-13 digits)
  if (digits.length >= 11) return `+${digits}`;

  // 10-digit Indian mobile number — prepend +91
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;

  return null;
}

function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

/**
 * Schedule the unconverted drip follow-up sequence for a lead.
 * Steps are inserted as future-dated rows in follow_up_sequences.
 */
async function scheduleFollowUpSequence(leadId: string): Promise<void> {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const steps = [
    { step_number: 1, offset: 1 * day,  channel: 'whatsapp', template_name: 'still_here' },
    { step_number: 2, offset: 3 * day,  channel: 'email',    template_name: 'testimonial' },
    { step_number: 3, offset: 7 * day,  channel: 'whatsapp', template_name: 'one_session' },
    { step_number: 4, offset: 14 * day, channel: 'email',    template_name: 'special_rate' },
  ] as const;

  const rows = steps.map((s) => ({
    lead_id: leadId,
    sequence_name: 'unconverted_drip',
    step_number: s.step_number,
    channel: s.channel,
    template_name: s.template_name,
    scheduled_at: new Date(now + s.offset).toISOString(),
    replied: false,
    is_cancelled: false,
  }));

  const { error } = await supabaseAdmin.from('follow_up_sequences').insert(rows);

  if (error) {
    logger.error('scheduleFollowUpSequence failed', { leadId, error: error.message });
  } else {
    logger.info('Follow-up sequence scheduled', { leadId, steps: steps.length });
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/leads — intake form submission
// ─────────────────────────────────────────────────────────────

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const {
    full_name,
    phone,
    email,
    whatsapp_number,
    therapy_type,
    presenting_issues,
    preferred_languages,
    source,
    utm_source,
    utm_medium,
    utm_campaign,
    country,
    city,
    timezone,
    urgency,
  } = req.body as Record<string, unknown>;

  // ── 1. Validate required fields ──────────────────────────────
  if (!full_name || typeof full_name !== 'string' || full_name.trim() === '') {
    res.status(400).json({ error: 'full_name is required' });
    return;
  }

  if (!phone || typeof phone !== 'string') {
    res.status(400).json({ error: 'phone is required' });
    return;
  }

  const normalisedPhone = normalisePhone(phone);
  if (!normalisedPhone || !isValidE164(normalisedPhone)) {
    res.status(400).json({ error: 'phone must be a valid number (E.164 or 10-digit Indian)' });
    return;
  }

  const waNumber =
    typeof whatsapp_number === 'string' && whatsapp_number.trim()
      ? normalisePhone(whatsapp_number) ?? normalisedPhone
      : normalisedPhone;

  // ── 2. Check for duplicate active lead ───────────────────────
  const { data: duplicate } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('phone', normalisedPhone)
    .not('status', 'in', '("lost","converted")')
    .limit(1)
    .single();

  let lead: Lead;

  if (duplicate) {
    logger.info('Duplicate lead found — updating', { leadId: duplicate.id, phone: normalisedPhone });

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('leads')
      .update({
        full_name: (full_name as string).trim(),
        email: email ?? duplicate.email,
        whatsapp_number: waNumber,
        therapy_type: therapy_type ?? duplicate.therapy_type,
        presenting_issues: presenting_issues ?? duplicate.presenting_issues,
        preferred_languages: preferred_languages ?? duplicate.preferred_languages,
        urgency: urgency ?? duplicate.urgency,
      })
      .eq('id', duplicate.id)
      .select('*')
      .single();

    if (updateError || !updated) {
      logger.error('Failed to update duplicate lead', { error: updateError?.message });
      res.status(500).json({ error: 'Failed to update lead' });
      return;
    }

    lead = updated as Lead;
  } else {
    // ── 3. Insert new lead ─────────────────────────────────────
    const { data: created, error: insertError } = await supabaseAdmin
      .from('leads')
      .insert({
        full_name: (full_name as string).trim(),
        phone: normalisedPhone,
        email: email ?? null,
        whatsapp_number: waNumber,
        therapy_type: therapy_type ?? null,
        presenting_issues: Array.isArray(presenting_issues) ? presenting_issues : [],
        preferred_languages: Array.isArray(preferred_languages) ? preferred_languages : [],
        status: 'new',
        source: typeof source === 'string' ? source : 'website',
        utm_source: utm_source ?? null,
        utm_medium: utm_medium ?? null,
        utm_campaign: utm_campaign ?? null,
        country: country ?? null,
        city: city ?? null,
        timezone: timezone ?? null,
        urgency: urgency ?? null,
        follow_up_count: 0,
      })
      .select('*')
      .single();

    if (insertError || !created) {
      logger.error('Failed to insert lead', { error: insertError?.message });
      res.status(500).json({ error: 'Failed to create lead' });
      return;
    }

    lead = created as Lead;
    logger.info('New lead created', { leadId: lead.id, phone: normalisedPhone });
  }

  // Respond early — all following steps are non-blocking
  res.status(duplicate ? 200 : 201).json({ success: true, leadId: lead.id });

  // ── 4. Log analytics event ───────────────────────────────────
  supabaseAdmin
    .from('analytics_events')
    .insert({ event_type: 'form_submit', lead_id: lead.id, metadata: { source: lead.source } })
    .then(({ error }) => {
      if (error) logger.error('analytics insert failed', { error: error.message });
    });

  // ── 5. Trigger Vapi outbound call ────────────────────────────
  triggerOutboundCall(lead).catch((err) => {
    logger.error('Vapi call failed — will rely on WhatsApp fallback', {
      leadId: lead.id,
      error: (err as Error).message,
    });
  });

  // ── 6. Send WhatsApp welcome template ───────────────────────
  // Must use an approved template for proactive outreach (no 24-hr window open yet).
  // Template name: welcome_message  |  Language: en  |  No variables (static body)
  const waTarget = lead.whatsapp_number ?? lead.phone ?? '';
  if (waTarget) {
    const templateName = process.env.META_WA_WELCOME_TEMPLATE ?? 'welcome_message';
    const templateBody = 'Thank you for contacting India Therapist and I\'ll help you find the right therapist';

    sendTemplateMessage(waTarget, templateName, 'en', [])
      .then(() =>
        supabaseAdmin.from('conversations').insert({
          lead_id: lead.id,
          channel: 'whatsapp',
          direction: 'outbound',
          from_number: process.env.META_WA_PHONE_NUMBER_ID ?? null,
          to_number: waTarget,
          message_body: templateBody,
          ai_generated: false,
          ai_intent: 'welcome',
        })
      )
      .catch((err) => {
        logger.error('WhatsApp welcome template failed', { leadId: lead.id, error: (err as Error).message });
      });
  }

  // ── 7. Schedule follow-up drip sequence ──────────────────────
  if (!duplicate) {
    scheduleFollowUpSequence(lead.id);
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/leads — paginated list (admin)
// ─────────────────────────────────────────────────────────────

router.get('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  const statusFilter = req.query.status as string | undefined;

  let query = supabaseAdmin
    .from('leads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, count, error } = await query;

  if (error) {
    logger.error('GET /leads failed', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch leads' });
    return;
  }

  res.json({
    leads: data,
    pagination: { page, limit, total: count ?? 0, pages: Math.ceil((count ?? 0) / limit) },
  });
});

// ─────────────────────────────────────────────────────────────
// GET /api/leads/:id — full lead with relations (admin)
// ─────────────────────────────────────────────────────────────

router.get('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Fetch lead + related tables in parallel
  const [leadResult, conversationsResult, appointmentsResult, paymentsResult] = await Promise.all([
    supabaseAdmin.from('leads').select('*').eq('id', id).single(),
    supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('appointments')
      .select('*, therapists(full_name, slug, photo_url)')
      .eq('lead_id', id)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('payments')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false }),
  ]);

  if (leadResult.error || !leadResult.data) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }

  res.json({
    lead: leadResult.data,
    conversations: conversationsResult.data ?? [],
    appointments: appointmentsResult.data ?? [],
    payments: paymentsResult.data ?? [],
  });
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/leads/:id — update lead fields (admin)
// ─────────────────────────────────────────────────────────────

const PATCHABLE_FIELDS = new Set([
  'full_name', 'email', 'phone', 'whatsapp_number',
  'status', 'therapy_type', 'presenting_issues', 'pain_summary',
  'preferred_languages', 'matched_therapist_id', 'preferred_therapist_id',
  'urgency', 'budget_range', 'next_follow_up_at', 'lost_reason',
  'country', 'city', 'timezone',
]);

router.patch('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const body = req.body as Record<string, unknown>;

  // Only allow known fields — strip anything else
  const patch: Record<string, unknown> = {};
  for (const key of Object.keys(body)) {
    if (PATCHABLE_FIELDS.has(key)) {
      patch[key] = body[key];
    }
  }

  if (Object.keys(patch).length === 0) {
    res.status(400).json({ error: 'No patchable fields provided' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('leads')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    logger.error('PATCH /leads/:id failed', { id, error: error?.message });
    res.status(error?.code === 'PGRST116' ? 404 : 500).json({ error: error?.message ?? 'Update failed' });
    return;
  }

  logger.info('Lead patched', { id, fields: Object.keys(patch) });
  res.json({ success: true, lead: data });
});

export default router;
