-- Migration: 004_appointments.sql
-- Creates the appointments table

CREATE TABLE appointments (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  lead_id                 UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  therapist_id            UUID NOT NULL REFERENCES therapists(id) ON DELETE RESTRICT,

  -- Status
  status                  appointment_status NOT NULL DEFAULT 'pending_therapist',

  -- Scheduling
  session_date            DATE,
  session_time_utc        TIMESTAMPTZ,
  session_duration_min    INTEGER NOT NULL DEFAULT 60,
  client_timezone         TEXT,
  therapist_timezone      TEXT NOT NULL DEFAULT 'Asia/Kolkata',

  -- Slot negotiation
  offered_slots           JSONB,             -- array of {date, time_utc, time_ist, label}
  selected_slot           JSONB,             -- the slot the client chose

  -- Session delivery
  meeting_link            TEXT,

  -- Post-session
  session_notes           TEXT,
  client_rating           INTEGER CHECK (client_rating BETWEEN 1 AND 5),
  client_feedback         TEXT,

  -- Reminders
  reminder_24hr_sent      BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_1hr_sent       BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
