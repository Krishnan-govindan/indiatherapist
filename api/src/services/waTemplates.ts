// ─────────────────────────────────────────────────────────────
// WhatsApp Message Templates
//
// All templates here must be submitted to Meta for approval before
// they can be sent to users outside of the 24-hour customer service window.
//
// Submit with: npx ts-node src/scripts/submitTemplates.ts
// Approval takes 24-48 hours.
// Check status at: https://business.facebook.com/wa/manage/message-templates/
//
// Placeholder convention: {{1}}, {{2}}, … map to positional params
// passed when calling sendTemplateMessage() in whatsapp.ts.
// ─────────────────────────────────────────────────────────────

export type TemplateCategory = 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';

export interface TemplateComponent {
  type: 'BODY' | 'HEADER' | 'FOOTER' | 'BUTTONS';
  text: string;
}

export interface TemplateDefinition {
  /** Snake-case name sent to Meta — must be unique per WABA */
  name: string;
  language: string;
  category: TemplateCategory;
  components: TemplateComponent[];
  /** Human-readable description of each {{n}} placeholder */
  params: string[];
}

// ─────────────────────────────────────────────────────────────
// Template definitions
// ─────────────────────────────────────────────────────────────

export const TEMPLATES: Record<string, TemplateDefinition> = {

  // ── 1. 24-hour session reminder ────────────────────────────
  session_reminder_24hr: {
    name: 'session_reminder_24hr',
    language: 'en',
    category: 'UTILITY',
    components: [
      {
        type: 'BODY',
        text:
          'Hi {{1}}! 🙏 Friendly reminder — your therapy session with {{2}} is tomorrow at {{3}} ({{4}} time). Your meeting link: {{5}}\n\nSee you then!',
      },
    ],
    params: [
      '{{1}} — client first name',
      '{{2}} — therapist full name',
      '{{3}} — session time (e.g. "Tuesday, 15 Apr at 10:00 AM")',
      '{{4}} — client timezone (e.g. "EST")',
      '{{5}} — meeting link URL',
    ],
  },

  // ── 2. 1-hour session reminder ─────────────────────────────
  session_reminder_1hr: {
    name: 'session_reminder_1hr',
    language: 'en',
    category: 'UTILITY',
    components: [
      {
        type: 'BODY',
        text:
          'Your session starts in 1 hour! 🕐\nTherapist: {{1}}\nTime: {{2}}\nJoin here: {{3}}\n\nTake a moment to settle in before we begin 🙏',
      },
    ],
    params: [
      '{{1}} — therapist full name',
      '{{2}} — session time in client timezone',
      '{{3}} — meeting link URL',
    ],
  },

  // ── 3. Payment link ────────────────────────────────────────
  payment_link: {
    name: 'payment_link',
    language: 'en',
    category: 'UTILITY',
    components: [
      {
        type: 'BODY',
        text:
          'Great choice! To confirm your session with {{1}} on {{2}}, please complete the secure payment here:\n\n💳 {{3}}\n\n✅ ${{4}} for 60 minutes\n🔄 Full refund if unsatisfied\n🔒 Secured by Stripe',
      },
    ],
    params: [
      '{{1}} — therapist full name',
      '{{2}} — session date/time string',
      '{{3}} — Stripe payment link URL',
      '{{4}} — session rate in dollars (e.g. "97")',
    ],
  },

  // ── 4. Therapist slot request ──────────────────────────────
  therapist_slot_request: {
    name: 'therapist_slot_request',
    language: 'en',
    category: 'UTILITY',
    components: [
      {
        type: 'BODY',
        text:
          'Hi {{1}}! 🙏 A new client would like to book a session.\n\nConcern: {{2}}\nLanguage: {{3}}\nTimezone: {{4}}\n\nPlease reply with 3 available slots in the next 5 days:\nFormat: DD/MM HH:MM IST\n\nThank you!',
      },
    ],
    params: [
      '{{1}} — therapist first name',
      '{{2}} — client concern summary (e.g. "Anxiety, Relationships")',
      '{{3}} — client preferred language(s)',
      '{{4}} — client timezone (e.g. "US/Pacific (UTC-8)")',
    ],
  },

  // ── 5. Welcome new lead ────────────────────────────────────
  welcome_new_lead: {
    name: 'welcome_new_lead',
    language: 'en',
    category: 'MARKETING',
    components: [
      {
        type: 'BODY',
        text:
          'Hi {{1}}! 🙏 Welcome to India Therapist — the only online therapy platform dedicated to NRIs like you.\n\nI\'m Priya, your intake coordinator. I\'ll call you shortly to help find the perfect therapist for you.\n\nWhat brings you here today?\n1️⃣ Individual therapy\n2️⃣ Couples therapy\n3️⃣ Family therapy\n4️⃣ Just exploring',
      },
    ],
    params: [
      '{{1}} — client first name',
    ],
  },

};
