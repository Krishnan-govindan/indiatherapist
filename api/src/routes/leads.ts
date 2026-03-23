import { Router, Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';
import { triggerOutboundCall } from '../services/voiceCaller';
import { sendTemplateMessage, sendTextMessage, sendInteractiveButtons } from '../services/whatsapp';
import type { Lead, Therapist } from '../lib/types';

const AI_WA_NUMBER = process.env.AI_WA_NUMBER ?? '+18568782862';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://web-production-7bea1.up.railway.app';

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
// contactPreferredTherapist
// Called after lead create/update when a preferred_therapist_slug
// is submitted. Directly contacts the therapist via WhatsApp YES/NO
// and tells the client we're checking availability.
// ─────────────────────────────────────────────────────────────

async function contactPreferredTherapist(lead: Lead, therapistSlug: string): Promise<void> {
  // Look up therapist by slug
  const { data: therapistData } = await supabaseAdmin
    .from('therapists')
    .select('*')
    .eq('slug', therapistSlug)
    .eq('is_active', true)
    .single();

  if (!therapistData) {
    logger.warn('contactPreferredTherapist: therapist not found', { therapistSlug });
    return;
  }

  const therapist = therapistData as Therapist;

  // Create appointment
  const { data: appointment, error: aptErr } = await supabaseAdmin
    .from('appointments')
    .insert({
      lead_id: lead.id,
      therapist_id: therapist.id,
      status: 'pending_therapist',
      session_duration_min: 60,
      therapist_timezone: therapist.timezone,
      client_timezone: lead.timezone ?? null,
    })
    .select('id')
    .single();

  if (aptErr || !appointment) {
    logger.error('contactPreferredTherapist: failed to create appointment', { error: aptErr?.message });
    return;
  }

  // Create slot offer
  await supabaseAdmin.from('slot_offers').insert({
    appointment_id: appointment.id,
    therapist_id: therapist.id,
    lead_id: lead.id,
  });

  // Update or create ai_agent_session
  const { data: existingSession } = await supabaseAdmin
    .from('ai_agent_sessions')
    .select('id')
    .eq('lead_id', lead.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existingSession) {
    await supabaseAdmin
      .from('ai_agent_sessions')
      .update({
        session_state: 'slot_relay',
        current_therapist_id: therapist.id,
        slot_offer_sent: true,
        therapist_confirmed: false,
        escalated_to_human: false,
        context_json: { appointment_id: appointment.id },
      })
      .eq('id', existingSession.id);
  } else {
    await supabaseAdmin.from('ai_agent_sessions').insert({
      lead_id: lead.id,
      session_state: 'slot_relay',
      current_therapist_id: therapist.id,
      slot_offer_sent: true,
      context_json: { appointment_id: appointment.id },
    });
  }

  // Update lead
  await supabaseAdmin
    .from('leads')
    .update({ matched_therapist_id: therapist.id, status: 'slot_offered' })
    .eq('id', lead.id);

  // Send therapist YES/NO buttons
  if (therapist.whatsapp_number) {
    const clientName = lead.full_name ?? 'A client';
    const clientConcerns = lead.presenting_issues?.join(', ') || lead.pain_summary || 'Not specified';
    const clientTherapyType = lead.therapy_type || 'Not specified';

    const therapistMsg =
      `🙏 Hi ${therapist.full_name.split(' ')[0]}!\n\n` +
      `A client would like to book a session with you.\n\n` +
      `👤 Client: ${clientName}\n` +
      `📋 Looking for: ${clientTherapyType} therapy\n` +
      `💭 Concern: ${clientConcerns}\n\n` +
      `Are you available to take this client?`;

    await sendInteractiveButtons(therapist.whatsapp_number, therapistMsg, [
      { id: 'therapist_yes', title: 'Yes, available' },
      { id: 'therapist_no', title: 'Not available' },
    ]);

    await supabaseAdmin.from('conversations').insert({
      therapist_id: therapist.id,
      channel: 'whatsapp',
      direction: 'outbound',
      from_number: AI_WA_NUMBER,
      to_number: therapist.whatsapp_number,
      message_body: therapistMsg,
      ai_generated: true,
      ai_intent: 'availability_request_web',
    });
  }

  // Notify client on WhatsApp
  const clientWa = lead.whatsapp_number ?? lead.phone ?? '';
  if (clientWa) {
    const clientFirstName = lead.full_name?.split(' ')[0] ?? 'there';
    await sendTextMessage(
      clientWa,
      `Hi ${clientFirstName}! 🙏 We've reached out to *${therapist.full_name}* to check their availability.\n\nWe'll WhatsApp you as soon as they confirm. This usually takes a few hours.\n\nThank you for your patience! 💜`
    );

    await supabaseAdmin.from('conversations').insert({
      lead_id: lead.id,
      channel: 'whatsapp',
      direction: 'outbound',
      from_number: AI_WA_NUMBER,
      to_number: clientWa,
      message_body: `Availability request sent to ${therapist.full_name}`,
      ai_generated: true,
      ai_intent: 'therapist_request_web',
    });
  }

  logger.info('contactPreferredTherapist: therapist contacted', {
    leadId: lead.id,
    therapistId: therapist.id,
    therapistName: therapist.full_name,
    appointmentId: appointment.id,
  });
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
    preferred_therapist_slug,
    source,
    utm_source,
    utm_medium,
    utm_campaign,
    country,
    city,
    timezone,
    urgency,
    concern,
    support_type,
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

    // Normalize concern string → presenting_issues array (from /book form)
    const normalizedIssues = typeof concern === 'string' && concern.trim()
      ? concern.split(',').map((c) => c.trim()).filter(Boolean)
      : Array.isArray(presenting_issues) ? presenting_issues : null;

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('leads')
      .update({
        full_name: (full_name as string).trim(),
        email: email ?? duplicate.email,
        whatsapp_number: waNumber,
        therapy_type: (support_type as string | undefined) ?? (therapy_type as string | undefined) ?? duplicate.therapy_type,
        presenting_issues: normalizedIssues ?? duplicate.presenting_issues,
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
    // Normalize concern string → presenting_issues array (from /book form)
    const normalizedIssuesNew = typeof concern === 'string' && concern.trim()
      ? concern.split(',').map((c) => c.trim()).filter(Boolean)
      : Array.isArray(presenting_issues) ? presenting_issues : [];

    const { data: created, error: insertError } = await supabaseAdmin
      .from('leads')
      .insert({
        full_name: (full_name as string).trim(),
        phone: normalisedPhone,
        email: email ?? null,
        whatsapp_number: waNumber,
        therapy_type: (support_type as string | undefined) ?? (therapy_type as string | undefined) ?? null,
        presenting_issues: normalizedIssuesNew,
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

  const hasPreferredTherapist =
    typeof preferred_therapist_slug === 'string' && preferred_therapist_slug.trim() !== '';

  // Respond early — all following steps are non-blocking
  res.status(duplicate ? 200 : 201).json({
    success: true,
    leadId: lead.id,
    therapist_contacted: hasPreferredTherapist,
  });

  // ── 4. Log analytics event ───────────────────────────────────
  supabaseAdmin
    .from('analytics_events')
    .insert({ event_type: 'form_submit', lead_id: lead.id, metadata: { source: lead.source } })
    .then(({ error }) => {
      if (error) logger.error('analytics insert failed', { error: error.message });
    });

  // ── 5. If preferred therapist slug provided, contact them directly ──
  if (hasPreferredTherapist) {
    contactPreferredTherapist(lead, (preferred_therapist_slug as string).trim()).catch((err) => {
      logger.error('contactPreferredTherapist failed', {
        leadId: lead.id,
        therapistSlug: preferred_therapist_slug,
        error: (err as Error).message,
      });
    });
    // Skip standard welcome template and Vapi call — therapist contact handles WA outreach
    return;
  }

  // ── 6. Trigger Vapi outbound call (no therapist slug case) ──────────────
  triggerOutboundCall(lead).catch((err) => {
    logger.error('Vapi call failed — will rely on WhatsApp fallback', {
      leadId: lead.id,
      error: (err as Error).message,
    });
  });

  // ── 7. Send WhatsApp welcome template ───────────────────────
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
