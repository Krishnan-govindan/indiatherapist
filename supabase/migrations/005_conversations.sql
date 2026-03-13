-- Migration: 005_conversations.sql
-- Creates the conversations table (all message activity across channels)

CREATE TABLE conversations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations (nullable — a message may not yet be tied to a lead/therapist)
  lead_id           UUID REFERENCES leads(id) ON DELETE SET NULL,
  therapist_id      UUID REFERENCES therapists(id) ON DELETE SET NULL,

  -- Channel metadata
  channel           message_channel NOT NULL,
  direction         message_direction NOT NULL,

  -- Message content
  from_number       TEXT,
  to_number         TEXT,
  message_body      TEXT,
  media_url         TEXT,

  -- WhatsApp / Meta specifics
  template_name     TEXT,
  meta_message_id   TEXT,

  -- AI metadata
  ai_generated      BOOLEAN NOT NULL DEFAULT FALSE,
  ai_intent         TEXT,                    -- e.g. 'intake', 'slot_offer', 'follow_up'

  -- Timestamp (no updated_at — messages are immutable)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
