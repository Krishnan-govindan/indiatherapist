import Stripe from 'stripe';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';
import type { Lead, Therapist, Appointment } from '../lib/types';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Missing env: STRIPE_SECRET_KEY');
  return new Stripe(key, { apiVersion: '2026-02-25.clover' });
}

/** Platform fee: 20% of session rate */
const PLATFORM_FEE_PERCENT = 0.2;

// ─────────────────────────────────────────────────────────────
// 1. createPaymentLink
//    Creates a Stripe Payment Link for a therapy session.
//    Returns the shareable URL sent to the client via WhatsApp.
// ─────────────────────────────────────────────────────────────

export async function createPaymentLink(
  lead: Lead,
  therapist: Therapist,
  appointment: Appointment
): Promise<string> {
  const stripe = getStripe();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.indiatherapist.com';

  // Create a one-time price inline with the payment link
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: therapist.session_rate_cents,
          product_data: {
            name: `Therapy Session with ${therapist.full_name}`,
            description: '60-minute online therapy session · India Therapist',
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      lead_id: lead.id,
      appointment_id: appointment.id,
      therapist_id: therapist.id,
      therapist_name: therapist.full_name,
    },
    after_completion: {
      type: 'redirect',
      redirect: { url: `${appUrl}/booking-confirmed?session={CHECKOUT_SESSION_ID}` },
    },
    billing_address_collection: 'auto',
  });

  logger.info('Stripe payment link created', {
    leadId: lead.id,
    appointmentId: appointment.id,
    therapistId: therapist.id,
    amount: therapist.session_rate_cents,
    url: paymentLink.url,
  });

  return paymentLink.url;
}

// ─────────────────────────────────────────────────────────────
// 1b. createSessionPaymentLink
//     Simplified wrapper for the AI agent — handles all lookups.
//     Returns the payment URL string.
// ─────────────────────────────────────────────────────────────

export async function createSessionPaymentLink(
  leadId: string,
  therapistId: string,
  appointmentId: string
): Promise<string> {
  // Fetch lead, therapist, appointment in parallel
  const [leadResult, therapistResult, appointmentResult] = await Promise.all([
    supabaseAdmin.from('leads').select('*').eq('id', leadId).single(),
    supabaseAdmin.from('therapists').select('*').eq('id', therapistId).single(),
    supabaseAdmin.from('appointments').select('*').eq('id', appointmentId).single(),
  ]);

  if (leadResult.error || !leadResult.data) {
    throw new Error(`Lead not found: ${leadId}`);
  }
  if (therapistResult.error || !therapistResult.data) {
    throw new Error(`Therapist not found: ${therapistId}`);
  }
  if (appointmentResult.error || !appointmentResult.data) {
    throw new Error(`Appointment not found: ${appointmentId}`);
  }

  return createPaymentLink(
    leadResult.data as Lead,
    therapistResult.data as Therapist,
    appointmentResult.data as Appointment
  );
}

// ─────────────────────────────────────────────────────────────
// 2. createConnectPayout
//    Transfers therapist's share to their Stripe Connect account.
//    Therapist receives 80%; platform keeps 20%.
// ─────────────────────────────────────────────────────────────

export async function createConnectPayout(
  therapistStripeId: string,
  amountCents: number,
  appointmentId: string
): Promise<void> {
  if (!therapistStripeId) {
    logger.warn('createConnectPayout: no stripe_connect_id — skipping payout', { appointmentId });
    return;
  }

  const stripe = getStripe();
  const payoutAmountCents = Math.floor(amountCents * (1 - PLATFORM_FEE_PERCENT));

  try {
    const transfer = await stripe.transfers.create({
      amount: payoutAmountCents,
      currency: 'usd',
      destination: therapistStripeId,
      metadata: { appointment_id: appointmentId },
      description: `Therapy session payout — appointment ${appointmentId}`,
    });

    logger.info('Stripe Connect payout created', {
      transferId: transfer.id,
      appointmentId,
      therapistStripeId,
      payoutAmountCents,
      platformFeeCents: amountCents - payoutAmountCents,
    });
  } catch (err) {
    logger.error('createConnectPayout failed', {
      therapistStripeId,
      appointmentId,
      error: (err as Error).message,
    });
    throw err;
  }
}
