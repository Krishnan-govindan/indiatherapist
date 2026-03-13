import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';
import { sendTextMessage } from '../services/whatsapp';

const router = Router();

// ─────────────────────────────────────────────────────────────
// Vapi structured data extracted from intake call
// ─────────────────────────────────────────────────────────────

interface VapiStructuredData {
  presenting_concern?: string;
  preferred_language?: string;
  preferred_time?: string;   // morning | evening | weekend
  urgency?: string;          // immediate | this_week | exploring
}

// ─────────────────────────────────────────────────────────────
// Webhook signature verification
// Vapi sends VAPI_WEBHOOK_SECRET in the x-vapi-secret header
// ─────────────────────────────────────────────────────────────

function verifyVapiSecret(req: Request, res: Response): boolean {
  const secret = process.env.VAPI_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn('VAPI_WEBHOOK_SECRET not set — skipping verification');
    return true; // allow in development
  }

  const incoming = req.headers['x-vapi-secret'];
  if (incoming !== secret) {
    logger.warn('Vapi webhook secret mismatch');
    res.sendStatus(401);
    return false;
  }

  return true;
}

// ─────────────────────────────────────────────────────────────
// POST /webhooks/vapi
// ─────────────────────────────────────────────────────────────

router.post('/', (req: Request, res: Response) => {
  if (!verifyVapiSecret(req, res)) return;

  // Acknowledge immediately — Vapi requires fast response
  res.sendStatus(200);

  const event = req.body;
  // Vapi wraps server-url events under message.type; direct events use top-level type
  const eventType: string = event?.message?.type ?? event?.type ?? 'unknown';

  logger.info('Vapi webhook received', { type: eventType });

  if (eventType === 'end-of-call-report') {
    handleEndOfCallReport(event).catch((err) => {
      logger.error('handleEndOfCallReport unhandled error', { error: (err as Error).message });
    });
  }
});

// ─────────────────────────────────────────────────────────────
// end-of-call-report handler
// ─────────────────────────────────────────────────────────────

async function handleEndOfCallReport(event: Record<string, unknown>): Promise<void> {
  const payload = (event.message ?? event) as Record<string, unknown>;

  const callId =
    ((payload.call as Record<string, unknown>)?.id as string | undefined) ??
    (payload.callId as string | undefined);

  const summary = payload.summary as string | undefined;
  const transcript = payload.transcript as string | undefined;
  const structuredData = payload.structuredData as VapiStructuredData | undefined;

  if (!callId) {
    logger.warn('end-of-call-report missing callId', { keys: Object.keys(payload) });
    return;
  }

  logger.info('Processing end-of-call-report', { callId, hasStructured: !!structuredData });

  // ── 1. Find lead by voice_call_id ────────────────────────────
  const { data: lead, error: leadError } = await supabaseAdmin
    .from('leads')
    .select('id, full_name, whatsapp_number, status')
    .eq('voice_call_id', callId)
    .single();

  if (leadError || !lead) {
    logger.warn('No lead found for Vapi callId', { callId, error: leadError?.message });
    return;
  }

  // ── 2. Build lead update ─────────────────────────────────────
  const callSummary = summary ?? transcript ?? 'No summary provided';

  const leadUpdate: Record<string, unknown> = {
    voice_call_summary: callSummary,
    status: 'qualified',
  };

  if (structuredData) {
    if (structuredData.presenting_concern) {
      leadUpdate.pain_summary = structuredData.presenting_concern;
    }
    if (structuredData.preferred_language) {
      leadUpdate.preferred_languages = [structuredData.preferred_language];
    }
    if (structuredData.urgency) {
      leadUpdate.urgency = structuredData.urgency;
    }
    // preferred_time stored in budget_range until a dedicated column is added
    if (structuredData.preferred_time) {
      leadUpdate.budget_range = structuredData.preferred_time;
    }
  }

  const { error: updateError } = await supabaseAdmin
    .from('leads')
    .update(leadUpdate)
    .eq('id', lead.id);

  if (updateError) {
    logger.error('Failed to update lead after call', {
      leadId: lead.id,
      error: updateError.message,
    });
    return;
  }

  logger.info('Lead updated after Vapi call', { leadId: lead.id, newStatus: 'qualified' });

  // ── 3. Log to conversations table ────────────────────────────
  await supabaseAdmin.from('conversations').insert({
    lead_id: lead.id,
    therapist_id: null,
    channel: 'voice',
    direction: 'inbound',
    from_number: null,
    to_number: null,
    message_body: callSummary,
    ai_generated: true,
    ai_intent: 'intake',
  });

  // ── 4. WhatsApp follow-up ────────────────────────────────────
  if (lead.whatsapp_number) {
    await sendTherapistMatchingMessage(lead.id, lead.whatsapp_number, lead.full_name);
  } else {
    logger.warn('Lead has no whatsapp_number — skipping WA follow-up', { leadId: lead.id });
  }
}

// ─────────────────────────────────────────────────────────────
// Post-call WhatsApp message to lead
// ─────────────────────────────────────────────────────────────

async function sendTherapistMatchingMessage(
  leadId: string,
  whatsappNumber: string,
  fullName: string | null
): Promise<void> {
  const name = fullName ?? 'there';

  const message =
    `Hi ${name} 👋 Thank you for speaking with us!\n\n` +
    `Based on our conversation, we're now finding the best therapist for you. ` +
    `You'll hear back within a few hours with personalised options.\n\n` +
    `If you have any questions in the meantime, just reply here. 🙏`;

  try {
    await sendTextMessage(whatsappNumber, message);

    await supabaseAdmin.from('conversations').insert({
      lead_id: leadId,
      therapist_id: null,
      channel: 'whatsapp',
      direction: 'outbound',
      from_number: process.env.META_WA_PHONE_NUMBER_ID ?? null,
      to_number: whatsappNumber,
      message_body: message,
      ai_generated: true,
      ai_intent: 'therapist_matching',
    });

    logger.info('Post-call WA follow-up sent', { leadId, whatsappNumber });
  } catch (err) {
    logger.error('Failed to send post-call WA message', {
      leadId,
      error: (err as Error).message,
    });
  }
}

export default router;
