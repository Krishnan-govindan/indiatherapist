-- Migration: 003_leads.sql
-- Creates the leads table (potential clients who've expressed interest)

CREATE TABLE leads (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Personal info
  full_name                TEXT,
  email                    TEXT,
  phone                    TEXT,
  whatsapp_number          TEXT,

  -- Location
  country                  TEXT,
  city                     TEXT,
  timezone                 TEXT,

  -- Therapy preferences
  preferred_languages      TEXT[] DEFAULT '{}',
  therapy_type             TEXT,
  presenting_issues        TEXT[] DEFAULT '{}',
  pain_summary             TEXT,              -- AI-generated from intake call/form

  -- Matching
  preferred_therapist_id   UUID REFERENCES therapists(id) ON DELETE SET NULL,
  matched_therapist_id     UUID REFERENCES therapists(id) ON DELETE SET NULL,

  -- Pipeline status
  status                   lead_status NOT NULL DEFAULT 'new',

  -- Attribution / UTM
  source                   TEXT,              -- website | whatsapp | referral | ad
  utm_source               TEXT,
  utm_medium               TEXT,
  utm_campaign             TEXT,

  -- Voice call (Vapi)
  voice_call_id            TEXT,              -- Vapi call ID
  voice_call_summary       TEXT,

  -- Budget & urgency
  budget_range             TEXT,
  urgency                  TEXT,              -- immediate | this_week | exploring

  -- Follow-up tracking
  follow_up_count          INTEGER NOT NULL DEFAULT 0,
  next_follow_up_at        TIMESTAMPTZ,

  -- Conversion
  converted_at             TIMESTAMPTZ,
  lost_reason              TEXT,

  -- Timestamps
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
