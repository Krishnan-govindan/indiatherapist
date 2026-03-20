import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';
import { sendTextMessage } from '../services/whatsapp';
import { createConnectPayout } from '../services/stripeService';

const router = Router();

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Missing env: STRIPE_SECRET_KEY');
  return new Stripe(key, { apiVersion: '2026-02-25.clover' });
}

// ─────────────────────────────────────────────────────────────
// POST /webhooks/stripe
// Raw body is configured in index.ts for this path so that
// stripe.webhooks.constructEvent() can verify the signature.
// ─────────────────────────────────────────────────────────────

router.post('/', (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig) {
    logger.warn('Stripe webhook missing stripe-signature header');
    res.sendStatus(400);
    return;
  }

  if (!webhookSecret) {
    logger.error('Missing env: STRIPE_WEBHOOK_SECRET');
    res.sendStatus(500);
    return;
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
  } catch (err) {
    logger.warn('Stripe webhook signature verification failed', { error: (err as Error).message });
    res.sendStatus(400);
    return;
  }

  // Acknowledge immediately — process async
  res.sendStatus(200);

  logger.info('Stripe webhook received', { type: event.type, id: event.id });

  if (
    event.type === 'payment_intent.succeeded' ||
    event.type === 'checkout.session.completed'
  ) {
    handlePaymentSuccess(event).catch((err) => {
      logger.error('handlePaymentSuccess unhandled error', {
        eventType: event.type,
        eventId: event.id,
        error: (err as Error).message,
      });
    });
  }
});

// ─────────────────────────────────────────────────────────────
// Payment success handler — shared between PI and checkout events
// ─────────────────────────────────────────────────────────────

async function handlePaymentSuccess(event: Stripe.Event): Promise<void> {
  // Extract metadata — shape differs between event types
  let metadata: Record<string, string> = {};
  let amountCents = 0;
  let receiptUrl: string | null = null;
  let stripePaymentIntentId: string | null = null;
  let stripeCheckoutSessionId: string | null = null;

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    metadata = (pi.metadata as Record<string, string>) ?? {};
    amountCents = pi.amount;
    receiptUrl = pi.latest_charge
      ? `https://dashboard.stripe.com/payments/${pi.id}`
      : null;
    stripePaymentIntentId = pi.id;
  } else if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    metadata = (session.metadata as Record<string, string>) ?? {};
    amountCents = session.amount_total ?? 0;
    receiptUrl = session.url ?? null;
    stripeCheckoutSessionId = session.id;
    stripePaymentIntentId =
      typeof session.payment_intent === 'string' ? session.payment_intent : null;
  }

  const { lead_id, appointment_id, therapist_id } = metadata;

  if (!lead_id || !appointment_id) {
    logger.warn('Stripe webhook: missing metadata', { metadata, eventType: event.type });
    return;
  }

  // ── 1. Fetch lead, appointment, therapist in parallel ────────
  const [leadResult, appointmentResult, therapistResult] = await Promise.all([
    supabaseAdmin.from('leads').select('*').eq('id', lead_id).single(),
    supabaseAdmin.from('appointments').select('*').eq('id', appointment_id).single(),
    therapist_id
      ? supabaseAdmin.from('therapists').select('*').eq('id', therapist_id).single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const lead = leadResult.data;
  const appointment = appointmentResult.data;
  const therapist = therapistResult.data;

  if (!lead || !appointment) {
    logger.error('Stripe webhook: lead or appointment not found', { lead_id, appointment_id });
    return;
  }

  const platformFeeCents = Math.floor(amountCents * 0.2);
  const therapistPayoutCents = amountCents - platformFeeCents;

  // ── 2. Upsert payments record ────────────────────────────────
  await supabaseAdmin.from('payments').upsert(
    {
      lead_id,
      appointment_id,
      therapist_id: therapist_id ?? null,
      stripe_payment_intent_id: stripePaymentIntentId,
      stripe_checkout_session_id: stripeCheckoutSessionId,
      amount_cents: amountCents,
      currency: 'usd',
      platform_fee_cents: platformFeeCents,
      therapist_payout_cents: therapistPayoutCents,
      status: 'succeeded',
      receipt_url: receiptUrl,
    },
    { onConflict: 'stripe_payment_intent_id' }
  );

  // ── 3. Update appointment status ─────────────────────────────
  // Generate a meeting link placeholder (Zoom/Google Meet deep link)
  const meetingLink = generateMeetingLink(appointment_id);

  await supabaseAdmin
    .from('appointments')
    .update({ status: 'confirmed', meeting_link: meetingLink })
    .eq('id', appointment_id);

  // ── 4. Update lead: converted ────────────────────────────────
  await supabaseAdmin
    .from('leads')
    .update({ status: 'converted', converted_at: new Date().toISOString() })
    .eq('id', lead_id);

  logger.info('Payment processed — lead converted', { lead_id, appointment_id, amountCents });

  // ── 4b. Update AI agent session to 'confirmed' ─────────────
  await supabaseAdmin
    .from('ai_agent_sessions')
    .update({
      session_state: 'confirmed',
      client_confirmed: true,
    })
    .eq('lead_id', lead_id)
    .eq('session_state', 'payment_sent');

  // ── 5. Format session datetime strings ──────────────────────
  const clientTz = lead.timezone ?? 'Asia/Kolkata';
  const sessionTimeClient = formatSessionTime(
    appointment.session_time_utc,
    appointment.session_date,
    clientTz
  );
  const sessionTimeIst = formatSessionTime(
    appointment.session_time_utc,
    appointment.session_date,
    'Asia/Kolkata'
  );

  // ── 6. WhatsApp confirmation to client ───────────────────────
  const clientWa = lead.whatsapp_number ?? lead.phone;
  if (clientWa) {
    const clientMsg =
      `✅ *Your session is confirmed!*\n\n` +
      `📅 ${sessionTimeClient}\n` +
      `👩‍⚕️ ${therapist?.full_name ?? 'Your therapist'}\n` +
      `🔗 ${meetingLink}\n\n` +
      `We'll remind you 24 hours and 1 hour before. Take care! 🙏`;

    await sendTextMessage(clientWa, clientMsg).catch((err) =>
      logger.error('Client confirmation WA failed', { lead_id, error: (err as Error).message })
    );

    // Log outbound message
    await supabaseAdmin.from('conversations').insert({
      lead_id,
      therapist_id: therapist_id ?? null,
      channel: 'whatsapp',
      direction: 'outbound',
      from_number: process.env.META_WA_PHONE_NUMBER_ID ?? null,
      to_number: clientWa,
      message_body: clientMsg,
      ai_generated: false,
      ai_intent: 'booking_confirmation',
    });
  }

  // ── 7. WhatsApp confirmation to therapist ────────────────────
  if (therapist?.whatsapp_number) {
    const clientFirstName = (lead.full_name ?? 'Client').split(' ')[0];

    const therapistMsg =
      `✅ *Payment confirmed!* Client ${clientFirstName} has paid for the session.\n\n` +
      `📅 Session: ${sessionTimeIst}\n` +
      `👤 Client: ${clientFirstName}\n` +
      `🔗 ${meetingLink}\n\n` +
      `Please coordinate the video call link with the client directly.\n` +
      `You can reach them via the platform once they respond to you.\n\n` +
      `Thank you for being part of India Therapist! 🙏`;

    await sendTextMessage(therapist.whatsapp_number, therapistMsg).catch((err) =>
      logger.error('Therapist confirmation WA failed', {
        therapist_id,
        error: (err as Error).message,
      })
    );
  }

  // ── 8. Trigger payout to therapist ───────────────────────────
  if (therapist?.stripe_connect_id) {
    createConnectPayout(therapist.stripe_connect_id, amountCents, appointment_id).catch((err) =>
      logger.error('Connect payout failed', { therapist_id, error: (err as Error).message })
    );
  }

  // ── 9. Log analytics conversion event ───────────────────────
  await supabaseAdmin.from('analytics_events').insert({
    event_type: 'conversion',
    lead_id,
    therapist_id: therapist_id ?? null,
    metadata: {
      amount_cents: amountCents,
      appointment_id,
      stripe_payment_intent_id: stripePaymentIntentId,
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Format a session timestamp for display in a given timezone.
 * Falls back to session_date string if UTC timestamp not set yet.
 */
function formatSessionTime(
  sessionTimeUtc: string | null,
  sessionDate: string | null,
  timezone: string
): string {
  if (sessionTimeUtc) {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(new Date(sessionTimeUtc));
    } catch {
      // fall through to date-only
    }
  }

  if (sessionDate) return sessionDate;
  return 'Time to be confirmed';
}

/**
 * Generate a Google Meet-style placeholder link.
 * Replace with real Zoom/Google Calendar API in Phase 2.
 */
function generateMeetingLink(appointmentId: string): string {
  // Derive a short deterministic code from the appointment ID
  const code = appointmentId.replace(/-/g, '').slice(0, 10).toLowerCase();
  return `https://meet.google.com/it-${code}`;
}

export default router;
