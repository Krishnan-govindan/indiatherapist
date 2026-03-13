import cron from 'node-cron';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';
import { escalateToNextTherapist } from '../services/slotCoordinator';

// ─────────────────────────────────────────────────────────────
// Main runner
// Finds slot_offers that have been waiting > 12hrs without a
// therapist response and escalates them to the next best match.
// ─────────────────────────────────────────────────────────────

async function runSlotExpiry(): Promise<void> {
  const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

  const { data: expiredOffers, error } = await supabaseAdmin
    .from('slot_offers')
    .select('id, appointment_id, therapist_id, lead_id, requested_at')
    .eq('is_expired', false)
    .lt('requested_at', cutoff)
    .is('therapist_responded_at', null);

  if (error) {
    logger.error('slotExpiry: query failed', { error: error.message });
    return;
  }

  if (!expiredOffers?.length) return;

  logger.warn('slotExpiry: found expired slot offers', { count: expiredOffers.length });

  for (const offer of expiredOffers) {
    await processExpiredOffer(offer as {
      id: string;
      appointment_id: string;
      therapist_id: string;
      lead_id: string;
      requested_at: string;
    });
  }
}

async function processExpiredOffer(offer: {
  id: string;
  appointment_id: string;
  therapist_id: string;
  lead_id: string;
  requested_at: string;
}): Promise<void> {
  logger.warn('slotExpiry: expiring offer', {
    offerId: offer.id,
    therapistId: offer.therapist_id,
    leadId: offer.lead_id,
    requestedAt: offer.requested_at,
  });

  // Mark as expired
  const { error: updateError } = await supabaseAdmin
    .from('slot_offers')
    .update({
      is_expired: true,
      expired_at: new Date().toISOString(),
    })
    .eq('id', offer.id);

  if (updateError) {
    logger.error('slotExpiry: failed to mark offer expired', {
      offerId: offer.id,
      error: updateError.message,
    });
    return;
  }

  // Escalate to next therapist
  await escalateToNextTherapist(
    offer.lead_id,
    offer.therapist_id,
    offer.appointment_id
  ).catch((err) => {
    logger.error('slotExpiry: escalation failed', {
      offerId: offer.id,
      leadId: offer.lead_id,
      error: (err as Error).message,
    });
  });
}

// ─────────────────────────────────────────────────────────────
// Register cron — every 2 hours
// ─────────────────────────────────────────────────────────────

export function registerSlotExpiryCron(): void {
  cron.schedule('0 */2 * * *', () => {
    logger.info('slotExpiry: cron tick');
    runSlotExpiry().catch((err) =>
      logger.error('slotExpiry: unhandled error', { error: (err as Error).message })
    );
  });

  logger.info('slotExpiry: registered (every 2 hours)');
}
