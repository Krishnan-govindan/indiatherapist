import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';
import type { Lead, Therapist } from '../lib/types';

const router = Router();

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Missing env: STRIPE_SECRET_KEY');
  return new Stripe(key, { apiVersion: '2026-02-25.clover' });
}

function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length >= 11) return `+${digits}`;
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  return null;
}

// ─────────────────────────────────────────────────────────────
// POST /api/checkout
// Creates a lead + Stripe Checkout Session in one step.
// Returns { checkout_url } for immediate redirect.
// ─────────────────────────────────────────────────────────────

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { full_name, phone, email, concern, therapist_slug } = req.body as Record<string, unknown>;

  // ── 1. Validate ───────────────────────────────────────────
  if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
    res.status(400).json({ error: 'full_name is required' });
    return;
  }
  if (!phone || typeof phone !== 'string') {
    res.status(400).json({ error: 'phone is required' });
    return;
  }
  if (!therapist_slug || typeof therapist_slug !== 'string') {
    res.status(400).json({ error: 'therapist_slug is required' });
    return;
  }

  const normalisedPhone = normalisePhone(phone);
  if (!normalisedPhone) {
    res.status(400).json({ error: 'Invalid phone number' });
    return;
  }

  // ── 2. Look up therapist ──────────────────────────────────
  const { data: therapist, error: therapistError } = await supabaseAdmin
    .from('therapists')
    .select('*')
    .eq('slug', therapist_slug)
    .eq('is_active', true)
    .single();

  if (therapistError || !therapist) {
    logger.warn('Checkout: therapist not found in DB', { therapist_slug });
    res.status(404).json({ error: 'Therapist not found' });
    return;
  }

  const t = therapist as Therapist;

  // ── 3. Upsert lead ────────────────────────────────────────
  let lead: Lead;

  const { data: existing } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('phone', normalisedPhone)
    .not('status', 'in', '("lost","converted")')
    .limit(1)
    .single();

  if (existing) {
    lead = existing as Lead;
    logger.info('Checkout: existing lead found', { leadId: lead.id });
  } else {
    const { data: created, error: insertError } = await supabaseAdmin
      .from('leads')
      .insert({
        full_name: full_name.trim(),
        phone: normalisedPhone,
        email: email ?? null,
        whatsapp_number: normalisedPhone,
        preferred_therapist_id: t.id,
        presenting_issues: concern ? [concern as string] : [],
        preferred_languages: [],
        status: 'payment_pending',
        source: 'profile_page',
        follow_up_count: 0,
      })
      .select('*')
      .single();

    if (insertError || !created) {
      logger.error('Checkout: failed to create lead', { error: insertError?.message });
      res.status(500).json({ error: 'Failed to create lead' });
      return;
    }

    lead = created as Lead;
    logger.info('Checkout: lead created', { leadId: lead.id });
  }

  // ── 4. Create provisional appointment ────────────────────
  const { data: appointment, error: apptError } = await supabaseAdmin
    .from('appointments')
    .insert({
      lead_id: lead.id,
      therapist_id: t.id,
      status: 'payment_pending',
      session_duration_min: 60,
      therapist_timezone: t.timezone ?? 'Asia/Kolkata',
      client_timezone: null,
      reminder_24hr_sent: false,
      reminder_1hr_sent: false,
    })
    .select('*')
    .single();

  if (apptError || !appointment) {
    logger.error('Checkout: failed to create appointment', { error: apptError?.message });
    res.status(500).json({ error: 'Failed to create appointment' });
    return;
  }

  // ── 5. Create Stripe Checkout Session ─────────────────────
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.indiatherapist.com';

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: t.session_rate_cents,
            product_data: {
              name: `Therapy Session with ${t.full_name}`,
              description: '60-minute online therapy session · Book now, session time to be confirmed',
              images: t.photo_url ? [t.photo_url] : [],
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        lead_id: lead.id,
        appointment_id: appointment.id,
        therapist_id: t.id,
      },
      customer_email: typeof email === 'string' && email ? email : undefined,
      success_url: `${appUrl}/book/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/therapists/${therapist_slug}`,
      billing_address_collection: 'auto',
    });

    logger.info('Stripe Checkout Session created', {
      sessionId: session.id,
      leadId: lead.id,
      appointmentId: appointment.id,
      amount: t.session_rate_cents,
    });

    res.json({ checkout_url: session.url });
  } catch (err) {
    logger.error('Stripe Checkout Session creation failed', {
      error: (err as Error).message,
      leadId: lead.id,
    });
    res.status(500).json({ error: 'Payment setup failed. Please try again.' });
  }
});

export default router;
