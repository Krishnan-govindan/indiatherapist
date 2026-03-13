// ─────────────────────────────────────────────────────────────
// Enums — mirror PostgreSQL enum types in 001_enums.sql
// ─────────────────────────────────────────────────────────────

export type LeadStatus =
  | 'new'
  | 'voice_called'
  | 'qualified'
  | 'matched'
  | 'slot_offered'
  | 'payment_pending'
  | 'converted'
  | 'unconverted'
  | 'lost'
  | 'follow_up';

export type AppointmentStatus =
  | 'pending_therapist'
  | 'slots_offered'
  | 'slot_selected'
  | 'payment_pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

export type PaymentStatus =
  | 'pending'
  | 'succeeded'
  | 'failed'
  | 'refunded'
  | 'disputed';

export type MessageDirection = 'inbound' | 'outbound';

export type MessageChannel = 'whatsapp' | 'email' | 'voice' | 'web';

export type TherapistTier = 'elite' | 'premium';

// ─────────────────────────────────────────────────────────────
// Slot shape — used in appointments and slot_offers JSONB fields
// ─────────────────────────────────────────────────────────────

export interface Slot {
  date: string;       // ISO date string e.g. "2025-02-10"
  time_ist: string;   // e.g. "10:00 AM IST"
  time_utc?: string;  // e.g. "04:30 UTC"
  label: string;      // Human-readable e.g. "Monday, 10 Feb · 10:00 AM IST"
}

// ─────────────────────────────────────────────────────────────
// Table interfaces — mirror Supabase schema
// ─────────────────────────────────────────────────────────────

export interface Therapist {
  id: string;
  full_name: string;
  slug: string;
  tier: TherapistTier;
  session_rate_cents: number;
  specialties: string[];
  languages: string[];
  therapy_types: string[];
  bio: string | null;
  photo_url: string | null;
  education: string | null;
  experience_years: number | null;
  city: string | null;
  country: string;
  timezone: string;
  whatsapp_number: string | null;
  email: string | null;
  is_active: boolean;
  max_sessions_per_day: number;
  stripe_connect_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  country: string | null;
  city: string | null;
  timezone: string | null;
  preferred_languages: string[];
  therapy_type: string | null;
  presenting_issues: string[];
  pain_summary: string | null;
  preferred_therapist_id: string | null;
  matched_therapist_id: string | null;
  status: LeadStatus;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  voice_call_id: string | null;
  voice_call_summary: string | null;
  budget_range: string | null;
  urgency: string | null;
  follow_up_count: number;
  next_follow_up_at: string | null;
  converted_at: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  lead_id: string;
  therapist_id: string;
  status: AppointmentStatus;
  session_date: string | null;
  session_time_utc: string | null;
  session_duration_min: number;
  client_timezone: string | null;
  therapist_timezone: string;
  offered_slots: Slot[] | null;
  selected_slot: Slot | null;
  meeting_link: string | null;
  session_notes: string | null;
  client_rating: number | null;
  client_feedback: string | null;
  reminder_24hr_sent: boolean;
  reminder_1hr_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  lead_id: string | null;
  therapist_id: string | null;
  channel: MessageChannel;
  direction: MessageDirection;
  from_number: string | null;
  to_number: string | null;
  message_body: string | null;
  media_url: string | null;
  template_name: string | null;
  meta_message_id: string | null;
  ai_generated: boolean;
  ai_intent: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  lead_id: string;
  appointment_id: string | null;
  therapist_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_link_id: string | null;
  amount_cents: number;
  currency: string;
  platform_fee_cents: number | null;
  therapist_payout_cents: number | null;
  status: PaymentStatus;
  payment_method: string | null;
  receipt_url: string | null;
  refund_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface FollowUpSequence {
  id: string;
  lead_id: string;
  sequence_name: string;
  step_number: number;
  channel: MessageChannel;
  template_name: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  replied: boolean;
  is_cancelled: boolean;
  created_at: string;
}

export interface SlotOffer {
  id: string;
  appointment_id: string;
  therapist_id: string;
  lead_id: string;
  requested_at: string | null;
  therapist_responded_at: string | null;
  offered_slots: Slot[] | null;
  client_notified_at: string | null;
  client_selected_slot: Slot | null;
  client_responded_at: string | null;
  expired_at: string | null;
  is_expired: boolean;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  event_type: string;
  lead_id: string | null;
  therapist_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────
// Utility types
// ─────────────────────────────────────────────────────────────

/** Omit DB-managed fields for insert operations */
export type InsertLead = Omit<Lead, 'id' | 'created_at' | 'updated_at'>;
export type InsertAppointment = Omit<Appointment, 'id' | 'created_at' | 'updated_at'>;
export type InsertConversation = Omit<Conversation, 'id' | 'created_at'>;
export type InsertPayment = Omit<Payment, 'id' | 'created_at' | 'updated_at'>;
export type InsertFollowUpSequence = Omit<FollowUpSequence, 'id' | 'created_at'>;
