import Stripe from 'stripe';
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
            description: '60-minute online therapy session',
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      lead_id: lead.id,
      appointment_id: appointment.id,
      therapist_id: therapist.id,
    },
    after_completion: {
      type: 'redirect',
      redirect: { url: `${appUrl}/book/confirmation` },
    },
    // Collect billing address for international clients
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
