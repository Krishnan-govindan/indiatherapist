-- Migration: 010_indexes_rls.sql
-- Performance indexes and Row Level Security policies

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────

-- leads: fast status filtering for pipeline views
CREATE INDEX idx_leads_status
  ON leads (status);

-- leads: only index rows pending follow-up (partial index)
CREATE INDEX idx_leads_next_follow_up
  ON leads (next_follow_up_at)
  WHERE status = 'follow_up';

-- appointments: pipeline and calendar queries
CREATE INDEX idx_appointments_status
  ON appointments (status);

CREATE INDEX idx_appointments_session_date
  ON appointments (session_date);

-- conversations: chronological message thread per lead
CREATE INDEX idx_conversations_lead_created
  ON conversations (lead_id, created_at DESC);

-- payments: Stripe webhook lookups
CREATE INDEX idx_payments_stripe_payment_intent
  ON payments (stripe_payment_intent_id);

-- follow_up_sequences: cron job picks up unsent, active steps
CREATE INDEX idx_follow_up_sequences_scheduled
  ON follow_up_sequences (scheduled_at)
  WHERE sent_at IS NULL AND is_cancelled = FALSE;

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

-- Enable RLS (no policies = no access except service role)
ALTER TABLE therapists   ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments     ENABLE ROW LEVEL SECURITY;

-- ── therapists ──────────────────────────────
-- Public: anyone can read active therapist profiles
CREATE POLICY "therapists_public_read"
  ON therapists FOR SELECT
  USING (is_active = TRUE);

-- Service role (API) can do everything — no policy restriction needed
-- (service_role bypasses RLS by default in Supabase)

-- ── leads ───────────────────────────────────
-- Only the service role (API) can access leads — no public policies

-- ── appointments ────────────────────────────
-- Only the service role (API) can access appointments — no public policies

-- ── payments ────────────────────────────────
-- Only the service role (API) can access payments — no public policies
