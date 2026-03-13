import cron from 'node-cron';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';
import { sendTextMessage } from '../services/whatsapp';
import type { Lead, MessageChannel } from '../lib/types';

// ─────────────────────────────────────────────────────────────
// WhatsApp message bodies keyed by template_name
// ─────────────────────────────────────────────────────────────

function buildWhatsAppBody(templateName: string, lead: Lead): string | null {
  switch (templateName) {
    case 'still_here':
      return (
        `Hi ${lead.full_name ?? 'there'}! Still thinking about it? ` +
        `No pressure — we're here whenever you're ready. ` +
        `Finding the right therapist can take time 🙏`
      );

    case 'one_session':
      return (
        `Many NRIs tell us the hardest part was the first session. ` +
        `After that, it felt natural. Your therapist will meet you where you are — ` +
        `no judgment, no pressure. Want to try one session? 🙏`
      );

    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Email bodies keyed by template_name (sent via Resend)
// ─────────────────────────────────────────────────────────────

interface EmailTemplate {
  subject: string;
  html: string;
}

function buildEmailTemplate(templateName: string, lead: Lead): EmailTemplate | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.indiatherapist.com';
  const country = lead.country ?? 'their home country';

  switch (templateName) {
    case 'testimonial':
      return {
        subject: 'A story that might resonate with you',
        html: `
          <p>Hi ${lead.full_name ?? 'there'},</p>
          <p>An NRI in ${country} recently shared:</p>
          <blockquote style="border-left:4px solid #6366f1;padding-left:16px;color:#555;">
            "I was skeptical about online therapy with an Indian therapist. But my first session
            with India Therapist changed everything. My therapist understood my family situation
            without me having to explain the basics."
          </blockquote>
          <p>This could be your story too.</p>
          <p>
            <a href="${appUrl}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
              Find My Therapist
            </a>
          </p>
          <p>With care,<br/>The India Therapist Team</p>
        `,
      };

    case 'special_rate':
      return {
        subject: 'A welcome gift for your first session 🙏',
        html: `
          <p>Hi ${lead.full_name ?? 'there'},</p>
          <p>
            We know taking the first step can feel big. That's why we want to make it
            as easy as possible for you.
          </p>
          <p>
            Your first session with India Therapist is available at our <strong>welcome rate</strong>
            — the same quality, the same care, just a little encouragement to get started.
          </p>
          <p>
            <a href="${appUrl}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
              Book My First Session
            </a>
          </p>
          <p>This offer is waiting for you whenever you're ready.</p>
          <p>Warmly,<br/>The India Therapist Team</p>
        `,
      };

    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Send email via Resend REST API (no SDK needed)
// ─────────────────────────────────────────────────────────────

async function sendResendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? 'hello@indiatherapist.com';

  if (!apiKey) {
    logger.warn('RESEND_API_KEY not set — skipping email', { to });
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API error ${response.status}: ${body}`);
  }
}

// ─────────────────────────────────────────────────────────────
// Main runner — processes all due follow-up steps
// ─────────────────────────────────────────────────────────────

async function runFollowUps(): Promise<void> {
  const { data: dueSteps, error } = await supabaseAdmin
    .from('follow_up_sequences')
    .select('*')
    .lte('scheduled_at', new Date().toISOString())
    .is('sent_at', null)
    .eq('is_cancelled', false)
    .order('scheduled_at', { ascending: true })
    .limit(50); // process in batches to avoid overload

  if (error) {
    logger.error('followUpRunner: query failed', { error: error.message });
    return;
  }

  if (!dueSteps || dueSteps.length === 0) return;

  logger.info('followUpRunner: processing due steps', { count: dueSteps.length });

  for (const step of dueSteps) {
    await processStep(step);
  }
}

async function processStep(step: Record<string, unknown>): Promise<void> {
  const stepId = step.id as string;
  const leadId = step.lead_id as string;
  const channel = step.channel as MessageChannel;
  const templateName = step.template_name as string;

  // Fetch lead
  const { data: lead, error: leadError } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (leadError || !lead) {
    logger.warn('followUpRunner: lead not found — cancelling step', { stepId, leadId });
    await supabaseAdmin
      .from('follow_up_sequences')
      .update({ is_cancelled: true })
      .eq('id', stepId);
    return;
  }

  // Cancel if lead is no longer in the drip-eligible pipeline
  if (lead.status === 'converted' || lead.status === 'lost') {
    await supabaseAdmin
      .from('follow_up_sequences')
      .update({ is_cancelled: true })
      .eq('id', stepId);
    logger.info('followUpRunner: sequence cancelled (lead converted/lost)', {
      stepId,
      leadId,
      status: lead.status,
    });
    return;
  }

  try {
    if (channel === 'whatsapp') {
      const waTarget = (lead as Lead).whatsapp_number ?? (lead as Lead).phone;
      if (!waTarget) {
        logger.warn('followUpRunner: lead has no WA/phone — skipping', { stepId, leadId });
      } else {
        const body = buildWhatsAppBody(templateName, lead as Lead);
        if (body) {
          await sendTextMessage(waTarget, body);
          logger.info('followUpRunner: WA sent', { stepId, leadId, templateName });
        } else {
          logger.warn('followUpRunner: unknown WA template — skipping', { templateName });
        }
      }
    } else if (channel === 'email') {
      if (!lead.email) {
        logger.warn('followUpRunner: lead has no email — skipping', { stepId, leadId });
      } else {
        const template = buildEmailTemplate(templateName, lead as Lead);
        if (template) {
          await sendResendEmail(lead.email as string, template.subject, template.html);
          logger.info('followUpRunner: email sent', { stepId, leadId, templateName });
        } else {
          logger.warn('followUpRunner: unknown email template — skipping', { templateName });
        }
      }
    }

    // Mark as sent
    await supabaseAdmin
      .from('follow_up_sequences')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', stepId);

  } catch (err) {
    logger.error('followUpRunner: step send failed', {
      stepId,
      leadId,
      templateName,
      error: (err as Error).message,
    });
    // Don't mark sent — will retry on next cron tick
  }
}

// ─────────────────────────────────────────────────────────────
// Register cron — every hour at :00
// ─────────────────────────────────────────────────────────────

export function registerFollowUpCron(): void {
  cron.schedule('0 * * * *', () => {
    logger.info('followUpRunner: cron tick');
    runFollowUps().catch((err) =>
      logger.error('followUpRunner: unhandled error', { error: (err as Error).message })
    );
  });

  logger.info('followUpRunner: registered (every hour)');
}
