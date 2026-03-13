-- Migration: 008_slot_offers.sql
-- Tracks the slot negotiation lifecycle between therapist and client

CREATE TABLE slot_offers (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  appointment_id            UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  therapist_id              UUID NOT NULL REFERENCES therapists(id) ON DELETE RESTRICT,
  lead_id                   UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Therapist side
  requested_at              TIMESTAMPTZ,           -- when we asked therapist for slots
  therapist_responded_at    TIMESTAMPTZ,
  offered_slots             JSONB,                 -- [{date, time_ist, label}, ...]

  -- Client side
  client_notified_at        TIMESTAMPTZ,
  client_selected_slot      JSONB,                 -- the slot object the client chose
  client_responded_at       TIMESTAMPTZ,

  -- Expiry
  expired_at                TIMESTAMPTZ,
  is_expired                BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamp
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
