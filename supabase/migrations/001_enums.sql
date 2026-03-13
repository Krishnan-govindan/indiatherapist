-- Migration: 001_enums.sql
-- Creates all PostgreSQL custom enum types for the India Therapist platform

CREATE TYPE lead_status AS ENUM (
  'new',
  'voice_called',
  'qualified',
  'matched',
  'slot_offered',
  'payment_pending',
  'converted',
  'unconverted',
  'lost',
  'follow_up'
);

CREATE TYPE appointment_status AS ENUM (
  'pending_therapist',
  'slots_offered',
  'slot_selected',
  'payment_pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
  'rescheduled'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'succeeded',
  'failed',
  'refunded',
  'disputed'
);

CREATE TYPE message_direction AS ENUM (
  'inbound',
  'outbound'
);

CREATE TYPE message_channel AS ENUM (
  'whatsapp',
  'email',
  'voice',
  'web'
);

CREATE TYPE therapist_tier AS ENUM (
  'elite',
  'premium'
);
