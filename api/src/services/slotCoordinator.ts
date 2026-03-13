import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';
import { sendTextMessage, sendInteractiveList } from './whatsapp';
import { matchTherapists } from './aiMatcher';
import type { Lead, Therapist, Slot } from '../lib/types';

// ─────────────────────────────────────────────────────────────
// 1. requestSlotsFromTherapist
//    Creates a slot_offer and messages the therapist on WhatsApp
// ─────────────────────────────────────────────────────────────

export async function requestSlotsFromTherapist(
  lead: Lead,
  therapist: Therapist,
  appointmentId: string
): Promise<void> {
  const now = new Date().toISOString();

  // Persist slot_offer record
  const { data: slotOffer, error: insertError } = await supabaseAdmin
    .from('slot_offers')
    .insert({
      appointment_id: appointmentId,
      therapist_id: therapist.id,
      lead_id: lead.id,
      requested_at: now,
      is_expired: false,
    })
    .select('id')
    .single();

  if (insertError || !slotOffer) {
    logger.error('requestSlotsFromTherapist: failed to create slot_offer', {
      error: insertError?.message,
      appointmentId,
    });
    throw new Error('Failed to create slot offer');
  }

  logger.info('Slot offer created', { slotOfferId: slotOffer.id, therapistId: therapist.id });

  if (!therapist.whatsapp_number) {
    logger.warn('Therapist has no whatsapp_number — cannot request slots', {
      therapistId: therapist.id,
    });
    return;
  }

  // Build client need summary
  const concern =
    lead.pain_summary ??
    (lead.presenting_issues?.length ? lead.presenting_issues.join(', ') : 'not specified');
  const languages = lead.preferred_languages?.join(', ') || 'not specified';
  const timezone = lead.timezone ?? 'not specified';

  const message =
    `Hi ${therapist.full_name}! 🙏 A new client would like to book a session with you.\n\n` +
    `*Client need:* ${concern}\n` +
    `*Language:* ${languages}\n` +
    `*Their timezone:* ${timezone}\n\n` +
    `Please reply with 3 available slots in the next 5 days.\n` +
    `Format: DD/MM HH:MM IST (e.g., 15/03 10:00 IST)\n\n` +
    `We'll coordinate the rest! Thank you 🙏`;

  await sendTextMessage(therapist.whatsapp_number, message);

  // Log outbound message to conversations
  await supabaseAdmin.from('conversations').insert({
    lead_id: lead.id,
    therapist_id: therapist.id,
    channel: 'whatsapp',
    direction: 'outbound',
    from_number: process.env.META_WA_PHONE_NUMBER_ID ?? null,
    to_number: therapist.whatsapp_number,
    message_body: message,
    ai_generated: false,
    ai_intent: 'slot_request',
  });

  logger.info('Slot request sent to therapist', {
    therapistId: therapist.id,
    slotOfferId: slotOffer.id,
  });

  // Schedule expiry checks (non-blocking)
  scheduleExpiryChecks(slotOffer.id, appointmentId, lead, therapist);
}

// ─────────────────────────────────────────────────────────────
// Expiry checks: 4hr reminder, 12hr escalation
// Uses setTimeout — suitable for single-instance Railway deployment.
// For multi-instance, move to a cron job polling slot_offers.
// ─────────────────────────────────────────────────────────────

function scheduleExpiryChecks(
  slotOfferId: string,
  appointmentId: string,
  lead: Lead,
  therapist: Therapist
): void {
  const FOUR_HOURS = 4 * 60 * 60 * 1000;
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;

  // 4-hour reminder
  setTimeout(async () => {
    const { data } = await supabaseAdmin
      .from('slot_offers')
      .select('therapist_responded_at, is_expired')
      .eq('id', slotOfferId)
      .single();

    if (!data || data.therapist_responded_at || data.is_expired) return;

    logger.warn('No therapist response after 4h — sending reminder', {
      slotOfferId,
      therapistId: therapist.id,
    });

    if (therapist.whatsapp_number) {
      await sendTextMessage(
        therapist.whatsapp_number,
        `Hi ${therapist.full_name}, just a gentle reminder 🙏 We're still waiting for your available slots for a client. Please reply with 3 times in DD/MM HH:MM IST format. Thank you!`
      ).catch((err) =>
        logger.error('4h reminder failed', { error: (err as Error).message })
      );
    }
  }, FOUR_HOURS);

  // 12-hour escalation
  setTimeout(async () => {
    const { data } = await supabaseAdmin
      .from('slot_offers')
      .select('therapist_responded_at, is_expired')
      .eq('id', slotOfferId)
      .single();

    if (!data || data.therapist_responded_at || data.is_expired) return;

    logger.warn('No therapist response after 12h — escalating', {
      slotOfferId,
      therapistId: therapist.id,
    });

    // Mark this offer as expired
    await supabaseAdmin
      .from('slot_offers')
      .update({ is_expired: true, expired_at: new Date().toISOString() })
      .eq('id', slotOfferId);

    await escalateToNextTherapist(lead.id, therapist.id, appointmentId);
  }, TWELVE_HOURS);
}

// ─────────────────────────────────────────────────────────────
// 2. parseTherapistSlots
//    Extracts up to 3 structured slot objects from free-text
//    Accepts: "15/03 10:00 IST", "15/3 10:00", "15-03 10:00"
// ─────────────────────────────────────────────────────────────

export function parseTherapistSlots(messageText: string): Slot[] {
  // Matches: DD/MM or DD-MM, followed by HH:MM, optionally followed by IST/UTC/timezone
  const pattern = /(\d{1,2})[\/\-](\d{1,2})\s+(\d{1,2}):(\d{2})(?:\s*(?:IST|UTC|AM|PM))?/gi;
  const slots: Slot[] = [];
  const year = new Date().getFullYear();
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(messageText)) !== null && slots.length < 3) {
    const [, day, month, hour, minute] = match;
    const d = day.padStart(2, '0');
    const m = month.padStart(2, '0');
    const h = hour.padStart(2, '0');
    const dateStr = `${year}-${m}-${d}`;

    // Build a display label with day name
    const dayName = getDayName(dateStr);

    slots.push({
      date: dateStr,
      time_ist: `${h}:${minute} IST`,
      label: `${dayName}, ${d}/${m} · ${h}:${minute} IST`,
    });
  }

  return slots;
}

function getDayName(isoDate: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  try {
    return days[new Date(isoDate).getDay()] ?? '';
  } catch {
    return '';
  }
}

// ─────────────────────────────────────────────────────────────
// 3. relaySlotToClient
//    Converts IST slots to client timezone, sends interactive list
// ─────────────────────────────────────────────────────────────

export async function relaySlotToClient(
  lead: Lead,
  therapist: Therapist,
  slots: Slot[],
  appointmentId: string
): Promise<void> {
  if (!lead.whatsapp_number) {
    logger.warn('relaySlotToClient: lead has no whatsapp_number', { leadId: lead.id });
    return;
  }

  // Convert IST slots to client's local timezone for display
  const clientTz = lead.timezone ?? 'Asia/Kolkata';
  const localizedSlots = slots.map((slot) => convertSlotToTimezone(slot, clientTz));

  // Build interactive list sections
  const listItems = localizedSlots.map((slot, index) => ({
    id: `slot_${index + 1}`,
    title: `${index + 1}️⃣ ${slot.time_ist}`,
    description: slot.label,
  }));

  const sections = [
    {
      title: 'Available Times',
      rows: listItems,
    },
  ];

  try {
    await sendInteractiveList(
      lead.whatsapp_number,
      `Your session with ${therapist.full_name} 🗓️`,
      `${therapist.full_name} is available at these times:`,
      sections
    );
  } catch {
    // Fallback to plain text if interactive list fails (e.g. non-WhatsApp number)
    const slotLines = localizedSlots.map((s, i) => `${i + 1}. ${s.label}`).join('\n');
    await sendTextMessage(
      lead.whatsapp_number,
      `Your session with ${therapist.full_name} 🗓️\n\n` +
        `${therapist.full_name} is available at:\n\n${slotLines}\n\n` +
        `Reply with *1*, *2*, or *3* to confirm your slot.`
    );
  }

  // Log outbound message
  await supabaseAdmin.from('conversations').insert({
    lead_id: lead.id,
    therapist_id: therapist.id,
    channel: 'whatsapp',
    direction: 'outbound',
    from_number: process.env.META_WA_PHONE_NUMBER_ID ?? null,
    to_number: lead.whatsapp_number,
    message_body: `Slot options sent: ${localizedSlots.map((s) => s.label).join(' | ')}`,
    ai_generated: false,
    ai_intent: 'slot_offer',
  });

  // Update slot_offer and appointment
  const now = new Date().toISOString();

  await Promise.all([
    supabaseAdmin
      .from('slot_offers')
      .update({ client_notified_at: now })
      .eq('appointment_id', appointmentId)
      .eq('therapist_id', therapist.id),

    supabaseAdmin
      .from('appointments')
      .update({ status: 'slots_offered', offered_slots: slots })
      .eq('id', appointmentId),

    supabaseAdmin
      .from('leads')
      .update({ status: 'slot_offered' })
      .eq('id', lead.id),
  ]);

  logger.info('Slots relayed to client', {
    leadId: lead.id,
    therapistId: therapist.id,
    slotCount: slots.length,
    clientTz,
  });
}

/**
 * Convert an IST slot to the target timezone for display.
 * Returns a new Slot with label reflecting the client's local time.
 * Falls back to the original IST label if conversion fails.
 */
function convertSlotToTimezone(slot: Slot, targetTz: string): Slot {
  if (targetTz === 'Asia/Kolkata') return slot;

  try {
    // Parse "YYYY-MM-DD" + "HH:MM IST" into a Date in IST
    const timePart = slot.time_ist.replace(' IST', '').trim();
    const [hour, minute] = timePart.split(':').map(Number);
    const istDate = new Date(`${slot.date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+05:30`);

    const localTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: targetTz,
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(istDate);

    return {
      ...slot,
      label: `${localTime} (${abbreviateTz(targetTz)})`,
    };
  } catch {
    return slot; // Fallback to IST label on any parse error
  }
}

function abbreviateTz(tz: string): string {
  // e.g. "America/New_York" → "EST/EDT" via Intl
  try {
    const parts = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'short' })
      .formatToParts(new Date());
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? tz;
  } catch {
    return tz;
  }
}

// ─────────────────────────────────────────────────────────────
// 4. handleClientSlotSelection
// ─────────────────────────────────────────────────────────────

export async function handleClientSlotSelection(
  lead: Lead,
  appointmentId: string,
  selectedSlot: Slot
): Promise<void> {
  const now = new Date().toISOString();

  await Promise.all([
    supabaseAdmin
      .from('slot_offers')
      .update({
        client_selected_slot: selectedSlot,
        client_responded_at: now,
      })
      .eq('appointment_id', appointmentId)
      .eq('lead_id', lead.id),

    supabaseAdmin
      .from('appointments')
      .update({
        status: 'slot_selected',
        selected_slot: selectedSlot,
        session_date: selectedSlot.date,
      })
      .eq('id', appointmentId),

    supabaseAdmin
      .from('leads')
      .update({ status: 'payment_pending' })
      .eq('id', lead.id),
  ]);

  logger.info('Client slot selection recorded', {
    leadId: lead.id,
    appointmentId,
    selectedSlot: selectedSlot.label,
  });

  // TODO (Phase 2): generate Stripe Payment Link and send to client
  // const paymentLink = await createStripePaymentLink(lead, appointmentId);
  // await sendTextMessage(lead.whatsapp_number!, paymentLink.url);

  if (lead.whatsapp_number) {
    await sendTextMessage(
      lead.whatsapp_number,
      `Great choice! 🎉 Your slot *${selectedSlot.label}* has been noted.\n\n` +
        `We're preparing your payment link now — you'll receive it in just a moment. 🙏`
    ).catch((err) =>
      logger.error('handleClientSlotSelection: WA ack failed', { error: (err as Error).message })
    );
  }
}

// ─────────────────────────────────────────────────────────────
// 5. escalateToNextTherapist
//    Re-runs AI matching excluding the non-responsive therapist
// ─────────────────────────────────────────────────────────────

export async function escalateToNextTherapist(
  leadId: string,
  currentTherapistId: string,
  appointmentId: string
): Promise<void> {
  logger.warn('Escalating to next therapist', { leadId, excludedTherapistId: currentTherapistId });

  const { data: lead } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (!lead) {
    logger.error('escalateToNextTherapist: lead not found', { leadId });
    return;
  }

  // Re-run AI matching
  const matches = await matchTherapists(lead);

  // Exclude the non-responsive therapist
  const nextTherapist = matches.find((t: Therapist) => t.id !== currentTherapistId);

  if (nextTherapist) {
    logger.info('Escalating to next therapist', {
      leadId,
      nextTherapistId: nextTherapist.id,
    });
    await requestSlotsFromTherapist(lead, nextTherapist, appointmentId);
  } else {
    // No more matches — notify admin
    logger.error('No alternative therapist found — notifying admin', { leadId });

    const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER;
    if (adminNumber) {
      await sendTextMessage(
        adminNumber,
        `⚠️ *Escalation Alert*\n\n` +
          `Lead *${lead.full_name ?? leadId}* has no available therapist match after escalation.\n` +
          `Lead ID: \`${leadId}\`\n` +
          `Last therapist tried: \`${currentTherapistId}\`\n\n` +
          `Please assign a therapist manually.`
      ).catch((err) =>
        logger.error('Admin escalation WA failed', { error: (err as Error).message })
      );
    }
  }
}
