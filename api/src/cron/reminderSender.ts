import cron from 'node-cron';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';
import { sendTextMessage } from '../services/whatsapp';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatSessionTimeForDisplay(sessionTimeUtc: string | null, timezone: string): string {
  if (!sessionTimeUtc) return 'your upcoming session';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(sessionTimeUtc));
  } catch {
    return sessionTimeUtc;
  }
}

// ─────────────────────────────────────────────────────────────
// Main runner
// ─────────────────────────────────────────────────────────────

async function runReminders(): Promise<void> {
  const now = new Date();

  // Fetch all confirmed appointments with session dates set
  const { data: appointments, error } = await supabaseAdmin
    .from('appointments')
    .select(`
      *,
      leads (id, full_name, whatsapp_number, phone, timezone),
      therapists (id, full_name, whatsapp_number, timezone)
    `)
    .eq('status', 'confirmed')
    .not('session_time_utc', 'is', null);

  if (error) {
    logger.error('reminderSender: query failed', { error: error.message });
    return;
  }

  if (!appointments?.length) return;

  logger.info('reminderSender: checking appointments', { count: appointments.length });

  for (const appt of appointments) {
    const sessionTime = new Date(appt.session_time_utc as string);
    const msUntilSession = sessionTime.getTime() - now.getTime();
    const msAfterSession = now.getTime() - sessionTime.getTime();
    const sessionDurationMs = (appt.session_duration_min ?? 60) * 60 * 1000;

    const lead = appt.leads as Record<string, unknown> | null;
    const therapist = appt.therapists as Record<string, unknown> | null;

    // ── 24-hour reminder ─────────────────────────────────────
    const H25 = 25 * 60 * 60 * 1000;
    const H24 = 24 * 60 * 60 * 1000;

    if (
      !appt.reminder_24hr_sent &&
      msUntilSession > 0 &&
      msUntilSession <= H25
    ) {
      await send24HrReminder(appt, lead, therapist);
      await supabaseAdmin
        .from('appointments')
        .update({ reminder_24hr_sent: true })
        .eq('id', appt.id as string);
    }

    // ── 1-hour reminder ──────────────────────────────────────
    const M65 = 65 * 60 * 1000;

    if (
      !appt.reminder_1hr_sent &&
      msUntilSession > 0 &&
      msUntilSession <= M65
    ) {
      await send1HrReminder(appt, lead, therapist);
      await supabaseAdmin
        .from('appointments')
        .update({ reminder_1hr_sent: true })
        .eq('id', appt.id as string);
    }

    // ── Post-session rating request (1hr after session ends) ─
    const H1 = 60 * 60 * 1000;
    const sessionEndMs = sessionTime.getTime() + sessionDurationMs;
    const msAfterEnd = now.getTime() - sessionEndMs;

    if (
      msAfterEnd >= H1 &&
      msAfterEnd < H1 + 30 * 60 * 1000 && // 30-min window to avoid double-send
      !appt.client_rating // not yet rated
    ) {
      await sendRatingRequest(appt, lead, therapist);

      // Update appointment to 'completed' if still 'confirmed'
      await supabaseAdmin
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appt.id as string)
        .eq('status', 'confirmed');
    }

    // ── Re-booking nudge (24hrs after session ends) ──────────
    const H25AfterEnd = 25 * 60 * 60 * 1000;
    const H26AfterEnd = 26 * 60 * 60 * 1000;

    if (msAfterEnd >= H25AfterEnd && msAfterEnd < H26AfterEnd) {
      await sendRebookingNudge(appt, lead, therapist);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Message senders
// ─────────────────────────────────────────────────────────────

async function send24HrReminder(
  appt: Record<string, unknown>,
  lead: Record<string, unknown> | null,
  therapist: Record<string, unknown> | null
): Promise<void> {
  const sessionTimeUtc = appt.session_time_utc as string;
  const meetingLink = appt.meeting_link as string ?? 'Link to be shared shortly';

  // Client
  const clientWa = (lead?.whatsapp_number ?? lead?.phone) as string | null;
  if (clientWa) {
    const clientTz = (lead?.timezone as string) ?? 'Asia/Kolkata';
    const displayTime = formatSessionTimeForDisplay(sessionTimeUtc, clientTz);

    await sendTextMessage(
      clientWa,
      `⏰ *Session reminder!*\n\n` +
        `Your therapy session is tomorrow:\n` +
        `📅 ${displayTime}\n` +
        `👩‍⚕️ ${(therapist?.full_name as string) ?? 'Your therapist'}\n` +
        `🔗 ${meetingLink}\n\n` +
        `See you then! 🙏`
    ).catch((err) =>
      logger.error('24hr reminder to client failed', {
        appointmentId: appt.id,
        error: (err as Error).message,
      })
    );
  }

  // Therapist
  const therapistWa = therapist?.whatsapp_number as string | null;
  if (therapistWa) {
    const displayTimeIst = formatSessionTimeForDisplay(sessionTimeUtc, 'Asia/Kolkata');
    const clientFirstName = ((lead?.full_name as string) ?? 'Client').split(' ')[0];

    await sendTextMessage(
      therapistWa,
      `⏰ *Session reminder*\n\n` +
        `You have a session tomorrow:\n` +
        `📅 ${displayTimeIst}\n` +
        `👤 Client: ${clientFirstName}\n` +
        `🔗 ${meetingLink}\n\n` +
        `Thank you! 🙏`
    ).catch((err) =>
      logger.error('24hr reminder to therapist failed', {
        appointmentId: appt.id,
        error: (err as Error).message,
      })
    );
  }

  logger.info('reminderSender: 24hr reminders sent', { appointmentId: appt.id });
}

async function send1HrReminder(
  appt: Record<string, unknown>,
  lead: Record<string, unknown> | null,
  therapist: Record<string, unknown> | null
): Promise<void> {
  const sessionTimeUtc = appt.session_time_utc as string;
  const meetingLink = appt.meeting_link as string ?? 'Your link is being prepared';

  // Client
  const clientWa = (lead?.whatsapp_number ?? lead?.phone) as string | null;
  if (clientWa) {
    const clientTz = (lead?.timezone as string) ?? 'Asia/Kolkata';
    const displayTime = formatSessionTimeForDisplay(sessionTimeUtc, clientTz);

    await sendTextMessage(
      clientWa,
      `🔔 *Starting in 1 hour!*\n\n` +
        `📅 ${displayTime}\n` +
        `👩‍⚕️ ${(therapist?.full_name as string) ?? 'Your therapist'}\n` +
        `🔗 ${meetingLink}\n\n` +
        `Take a moment to find a quiet space. You've got this! 🙏`
    ).catch((err) =>
      logger.error('1hr reminder to client failed', {
        appointmentId: appt.id,
        error: (err as Error).message,
      })
    );
  }

  // Therapist
  const therapistWa = therapist?.whatsapp_number as string | null;
  if (therapistWa) {
    const displayTimeIst = formatSessionTimeForDisplay(sessionTimeUtc, 'Asia/Kolkata');
    const clientFirstName = ((lead?.full_name as string) ?? 'Client').split(' ')[0];

    await sendTextMessage(
      therapistWa,
      `🔔 *Starting in 1 hour*\n\n` +
        `📅 ${displayTimeIst}\n` +
        `👤 Client: ${clientFirstName}\n` +
        `🔗 ${meetingLink}`
    ).catch((err) =>
      logger.error('1hr reminder to therapist failed', {
        appointmentId: appt.id,
        error: (err as Error).message,
      })
    );
  }

  logger.info('reminderSender: 1hr reminders sent', { appointmentId: appt.id });
}

async function sendRatingRequest(
  appt: Record<string, unknown>,
  lead: Record<string, unknown> | null,
  therapist: Record<string, unknown> | null
): Promise<void> {
  const clientWa = (lead?.whatsapp_number ?? lead?.phone) as string | null;
  if (!clientWa) return;

  await sendTextMessage(
    clientWa,
    `How was your session with ${(therapist?.full_name as string) ?? 'your therapist'}? 🙏\n\n` +
      `Reply with a number to rate:\n` +
      `1️⃣ Needs improvement\n` +
      `2️⃣ It was okay\n` +
      `3️⃣ Good\n` +
      `4️⃣ Very good\n` +
      `5️⃣ Excellent ⭐`
  ).catch((err) =>
    logger.error('rating request failed', {
      appointmentId: appt.id,
      error: (err as Error).message,
    })
  );

  logger.info('reminderSender: rating request sent', { appointmentId: appt.id });
}

async function sendRebookingNudge(
  appt: Record<string, unknown>,
  lead: Record<string, unknown> | null,
  therapist: Record<string, unknown> | null
): Promise<void> {
  const clientWa = (lead?.whatsapp_number ?? lead?.phone) as string | null;
  if (!clientWa) return;

  await sendTextMessage(
    clientWa,
    `Hi ${((lead?.full_name as string) ?? 'there').split(' ')[0]} 👋\n\n` +
      `Ready to book your next session with ` +
      `${(therapist?.full_name as string) ?? 'your therapist'}?\n\n` +
      `Reply *YES* and we'll get it set up for you. 🙏`
  ).catch((err) =>
    logger.error('rebooking nudge failed', {
      appointmentId: appt.id,
      error: (err as Error).message,
    })
  );

  logger.info('reminderSender: rebooking nudge sent', { appointmentId: appt.id });
}

// ─────────────────────────────────────────────────────────────
// Register cron — every 30 minutes
// ─────────────────────────────────────────────────────────────

export function registerReminderCron(): void {
  cron.schedule('*/30 * * * *', () => {
    logger.info('reminderSender: cron tick');
    runReminders().catch((err) =>
      logger.error('reminderSender: unhandled error', { error: (err as Error).message })
    );
  });

  logger.info('reminderSender: registered (every 30 minutes)');
}
