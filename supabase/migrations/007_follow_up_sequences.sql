-- Migration: 007_follow_up_sequences.sql
-- Tracks automated drip/follow-up sequences sent to leads

CREATE TABLE follow_up_sequences (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relation
  lead_id          UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Sequence definition
  sequence_name    TEXT NOT NULL,     -- unconverted_drip | post_session | reactivation
  step_number      INTEGER NOT NULL,
  channel          message_channel NOT NULL,
  template_name    TEXT,

  -- Scheduling & delivery tracking
  scheduled_at     TIMESTAMPTZ,
  sent_at          TIMESTAMPTZ,
  opened_at        TIMESTAMPTZ,
  clicked_at       TIMESTAMPTZ,

  -- Engagement
  replied          BOOLEAN NOT NULL DEFAULT FALSE,

  -- Control
  is_cancelled     BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamp
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
