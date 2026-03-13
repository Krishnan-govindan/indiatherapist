-- Migration: 009_analytics.sql
-- Creates the analytics_events table for funnel tracking and reporting

CREATE TABLE analytics_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event classification
  event_type     TEXT NOT NULL,   -- page_view | form_submit | wa_message | voice_call | payment | conversion

  -- Optional context
  lead_id        UUID REFERENCES leads(id) ON DELETE SET NULL,
  therapist_id   UUID REFERENCES therapists(id) ON DELETE SET NULL,

  -- Flexible payload
  metadata       JSONB,

  -- Timestamp (immutable event log — no updated_at)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
