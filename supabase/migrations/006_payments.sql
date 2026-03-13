-- Migration: 006_payments.sql
-- Creates the payments table

CREATE TABLE payments (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  lead_id                       UUID NOT NULL REFERENCES leads(id) ON DELETE RESTRICT,
  appointment_id                UUID REFERENCES appointments(id) ON DELETE SET NULL,
  therapist_id                  UUID REFERENCES therapists(id) ON DELETE SET NULL,

  -- Stripe identifiers
  stripe_payment_intent_id      TEXT UNIQUE,
  stripe_checkout_session_id    TEXT,
  stripe_payment_link_id        TEXT,

  -- Amounts (all in cents)
  amount_cents                  INTEGER NOT NULL,
  currency                      TEXT NOT NULL DEFAULT 'USD',
  platform_fee_cents            INTEGER,       -- India Therapist's cut
  therapist_payout_cents        INTEGER,       -- net amount to therapist

  -- Status & details
  status                        payment_status NOT NULL DEFAULT 'pending',
  payment_method                TEXT,
  receipt_url                   TEXT,
  refund_reason                 TEXT,

  -- Timestamps
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
