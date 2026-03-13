-- Migration: 002_therapists.sql
-- Creates the therapists table

CREATE TABLE therapists (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  full_name            TEXT NOT NULL,
  slug                 TEXT NOT NULL UNIQUE,
  tier                 therapist_tier NOT NULL,

  -- Pricing (in cents, USD)
  -- elite = $144.00 = 14400 cents, premium = $97.00 = 9700 cents
  session_rate_cents   INTEGER NOT NULL,

  -- Professional profile
  specialties          TEXT[] NOT NULL DEFAULT '{}',
  languages            TEXT[] NOT NULL DEFAULT '{}',
  therapy_types        TEXT[] NOT NULL DEFAULT '{}',
  bio                  TEXT,
  photo_url            TEXT,
  education            TEXT,
  experience_years     INTEGER,

  -- Location
  city                 TEXT,
  country              TEXT NOT NULL DEFAULT 'India',
  timezone             TEXT NOT NULL DEFAULT 'Asia/Kolkata',

  -- Contact
  whatsapp_number      TEXT,
  email                TEXT,

  -- Availability
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  max_sessions_per_day INTEGER NOT NULL DEFAULT 6,

  -- Stripe Connect (for payouts to therapist)
  stripe_connect_id    TEXT,

  -- Timestamps
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER therapists_updated_at
  BEFORE UPDATE ON therapists
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
