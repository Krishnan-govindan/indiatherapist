// ─────────────────────────────────────────────────────────────
// AI Agent — Full Agentic Workflow Engine
//
// Handles the complete WhatsApp conversation lifecycle:
// greeting → intake → matching → slot_request → slot_relay
// → confirmed → escalated
//
// Uses WhatsApp interactive buttons/lists for guided flow.
// Uses Claude Haiku for AI responses when needed.
// ─────────────────────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';
import {
  sendTextMessage,
  sendInteractiveButtons,
  sendInteractiveList,
  markMessageRead,
} from '../services/whatsapp';
import { matchTherapists } from '../services/aiMatcher';
import {
  storeMessageEmbedding,
  getRelevantHistory,
  getLeadContextSummary,
  updateLeadContextSummary,
} from '../services/embeddingService';
import type { Therapist, Lead, Appointment } from '../lib/types';
import { createSessionPaymentLink } from '../services/stripeService';
import {
  KNOWLEDGE_BASE,
  BANNED_PHRASES,
  STATE_PROMPTS,
  FAQ_RESPONSES,
  SAFE_FALLBACK,
} from '../services/agentKnowledge';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const AI_WA_NUMBER = process.env.AI_WA_NUMBER ?? '+18568782862';
const SUPPORT_WA_NUMBER = process.env.SUPPORT_WA_NUMBER ?? '+14254424167';
const PLATFORM_NAME = 'India Therapist';

const SYSTEM_PROMPT = `You are Pooja, the AI assistant for ${PLATFORM_NAME} — the only online therapy platform dedicated to NRIs (Non-Resident Indians). You help clients find and book therapy sessions with Indian therapists.

Your personality: Warm, empathetic, culturally aware, professional. Never sound robotic. Speak like a caring friend who understands NRI struggles.

RULES:
1. Always address the client by their first name if known
2. If client mentions a specific therapist by name, match to the therapist list
3. Never share therapist personal phone numbers until session is confirmed
4. If you cannot help (refund, complaint, crisis), escalate to human support
5. Always respond in the same language the client writes in
6. Keep responses concise (2-3 sentences max) — this is WhatsApp, not email
7. Use emoji sparingly and naturally
8. Be culturally sensitive to Indian values and NRI experiences

NEVER SAY ANY OF THE FOLLOWING (these are strictly prohibited):
- "Our team will send you availability" or ANY variation of this
- "Booking link" (unless you are sending an actual Stripe payment link right now)
- "We will schedule your session" — the platform does NOT schedule sessions
- "Pick a time that works for you" — scheduling is between client and therapist directly
- "We will get back to you with times" or "available time slots"
- "Calendar link", "Zoom link", "Google Meet link", "video call link"
- "We will book your session" or "confirm your session time"
- ANY process, feature, or workflow NOT described in the platform knowledge below
- Do NOT make up or invent any processes that are not explicitly described below

${KNOWLEDGE_BASE}`;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─────────────────────────────────────────────────────────────
// Crisis-only escalation keywords (reduced false positives)
// ─────────────────────────────────────────────────────────────

const ESCALATION_KEYWORDS = [
  'suicide', 'self-harm', 'kill myself', 'end my life',
  'emergency', 'crisis', 'abuse',
  'refund', 'money back', 'fraud',
];

// ─────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────

export async function processIncomingMessage(
  fromNumber: string,
  messageText: string,
  messageId: string,
  messageType: string,
  interactiveReplyId?: string
): Promise<void> {
  try {
    // Mark as read (blue ticks)
    await markMessageRead(messageId);

    // Handle non-text messages
    if (messageType !== 'text' && messageType !== 'interactive') {
      logger.info('Non-text message received', { fromNumber, messageType });
      messageText = messageText || `[${messageType} message received]`;
    }

    // ── Check if this is a therapist messaging (BEFORE lead creation) ──
    const { data: therapistSender } = await supabaseAdmin
      .from('therapists')
      .select('*')
      .eq('whatsapp_number', fromNumber)
      .single();

    if (therapistSender) {
      await supabaseAdmin.from('conversations').insert({
        therapist_id: therapistSender.id,
        channel: 'whatsapp',
        direction: 'inbound',
        from_number: fromNumber,
        to_number: AI_WA_NUMBER,
        message_body: messageText,
        meta_message_id: messageId,
        ai_generated: false,
      });

      await handleTherapistMessage(therapistSender as Therapist, messageText, interactiveReplyId);
      return;
    }

    // ── STEP A: Identify or create lead ────────────────────────
    const { lead, isNew } = await getOrCreateLead(fromNumber);
    const leadId = lead.id;

    // Log inbound conversation
    const { data: convRecord } = await supabaseAdmin
      .from('conversations')
      .insert({
        lead_id: leadId,
        channel: 'whatsapp',
        direction: 'inbound',
        from_number: fromNumber,
        to_number: AI_WA_NUMBER,
        message_body: messageText,
        meta_message_id: messageId,
        ai_generated: false,
      })
      .select('id')
      .single();

    // Store in RAG
    if (convRecord) {
      await storeMessageEmbedding(leadId, convRecord.id, messageText, 'user');
    }

    // ── STEP B: Get or create agent session ────────────────────
    const session = await getOrCreateSession(leadId);

    // ── If escalated to human, just forward — don't auto-respond ──
    if (session.escalated_to_human && session.session_state === 'escalated') {
      await handleEscalated(lead, session, messageText);
      return;
    }

    // ── Check for SUPPORT keyword ──────────────────────────────
    if (messageText.trim().toUpperCase() === 'SUPPORT') {
      await escalateToHuman(lead, session, messageText, 'Client requested support');
      return;
    }

    // ── Check crisis escalation triggers ───────────────────────
    const lowerMsg = messageText.toLowerCase();
    const escalationMatch = ESCALATION_KEYWORDS.find((kw) => lowerMsg.includes(kw));
    if (escalationMatch) {
      await escalateToHuman(lead, session, messageText, `Crisis keyword: "${escalationMatch}"`);
      return;
    }

    // ── STEP D: Route by session state ─────────────────────────
    switch (session.session_state) {
      case 'greeting':
        await handleGreeting(lead, session, messageText, isNew, interactiveReplyId);
        break;
      case 'intake':
        await handleIntake(lead, session, messageText, interactiveReplyId);
        break;
      case 'matching':
        await handleMatching(lead, session, messageText, interactiveReplyId);
        break;
      case 'slot_request':
        await handleSlotRequest(lead, session, messageText, interactiveReplyId);
        break;
      case 'slot_relay':
        await handleSlotRelay(lead, session, messageText);
        break;
      case 'confirmed':
        await handleConfirmed(lead, session, messageText);
        break;
      case 'escalated':
        await handleEscalated(lead, session, messageText);
        break;
      default:
        await handleGreeting(lead, session, messageText, isNew, interactiveReplyId);
    }

    // ── Update context summary periodically ──────────────────
    const { count } = await supabaseAdmin
      .from('conversation_embeddings')
      .select('id', { count: 'exact', head: true })
      .eq('lead_id', leadId);

    if (count && count % 5 === 0) {
      updateLeadContextSummary(leadId).catch((err) =>
        logger.warn('Context summary update failed', { error: (err as Error).message })
      );
    }
  } catch (err) {
    logger.error('processIncomingMessage failed', {
      fromNumber,
      error: (err as Error).message,
      stack: (err as Error).stack,
    });
  }
}

// ─────────────────────────────────────────────────────────────
// Lead management — checks BOTH whatsapp_number AND phone
// ─────────────────────────────────────────────────────────────

async function getOrCreateLead(
  fromNumber: string
): Promise<{ lead: Lead; isNew: boolean }> {
  // Check whatsapp_number first
  const { data: byWA } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('whatsapp_number', fromNumber)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (byWA) {
    return { lead: byWA as Lead, isNew: false };
  }

  // Check phone field (user may have registered via website /book form)
  const { data: byPhone } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('phone', fromNumber)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (byPhone) {
    // Found by phone — set whatsapp_number so future lookups work
    await supabaseAdmin
      .from('leads')
      .update({ whatsapp_number: fromNumber })
      .eq('id', (byPhone as Lead).id);

    const merged = { ...byPhone, whatsapp_number: fromNumber } as Lead;
    logger.info('Lead found by phone, updated whatsapp_number', {
      leadId: merged.id,
      fromNumber,
    });
    return { lead: merged, isNew: false };
  }

  // Create new lead
  const { data: newLead, error } = await supabaseAdmin
    .from('leads')
    .insert({
      whatsapp_number: fromNumber,
      status: 'new',
      source: 'whatsapp',
    })
    .select('*')
    .single();

  if (error || !newLead) {
    throw new Error(`Failed to create lead: ${error?.message}`);
  }

  logger.info('New lead created from WhatsApp', { leadId: newLead.id, fromNumber });
  return { lead: newLead as Lead, isNew: true };
}

// ─────────────────────────────────────────────────────────────
// Session management
// ─────────────────────────────────────────────────────────────

interface AgentSession {
  id: string;
  lead_id: string;
  session_state: string;
  current_therapist_id: string | null;
  slot_offer_sent: boolean;
  payment_link: string | null;
  stripe_link_sent: boolean;
  therapist_confirmed: boolean;
  client_confirmed: boolean;
  escalated_to_human: boolean;
  escalation_reason: string | null;
  context_json: Record<string, unknown>;
}

async function getOrCreateSession(leadId: string): Promise<AgentSession> {
  const { data: existing } = await supabaseAdmin
    .from('ai_agent_sessions')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existing) return existing as AgentSession;

  const { data: newSession, error } = await supabaseAdmin
    .from('ai_agent_sessions')
    .insert({
      lead_id: leadId,
      session_state: 'greeting',
      context_json: {},
    })
    .select('*')
    .single();

  if (error || !newSession) {
    throw new Error(`Failed to create session: ${error?.message}`);
  }

  return newSession as AgentSession;
}

async function updateSession(
  sessionId: string,
  updates: Partial<AgentSession>
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('ai_agent_sessions')
    .update(updates)
    .eq('id', sessionId);

  if (error) {
    logger.error('updateSession failed', { sessionId, error: error.message });
  }
}

// ─────────────────────────────────────────────────────────────
// Send helpers — text, buttons, list — all log to DB + RAG
// ─────────────────────────────────────────────────────────────

async function sendAndLog(
  lead: Lead,
  message: string,
  aiIntent?: string
): Promise<void> {
  const to = lead.whatsapp_number!;
  await sendTextMessage(to, message);

  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .insert({
      lead_id: lead.id,
      channel: 'whatsapp',
      direction: 'outbound',
      from_number: AI_WA_NUMBER,
      to_number: to,
      message_body: message,
      ai_generated: true,
      ai_intent: aiIntent ?? null,
    })
    .select('id')
    .single();

  if (conv) {
    await storeMessageEmbedding(lead.id, conv.id, message, 'assistant');
  }
}

async function sendButtonsAndLog(
  lead: Lead,
  body: string,
  buttons: { id: string; title: string }[],
  aiIntent?: string
): Promise<void> {
  const to = lead.whatsapp_number!;
  await sendInteractiveButtons(to, body, buttons);

  const buttonLabels = buttons.map((b) => b.title).join(', ');
  const logMsg = `${body}\n[Buttons: ${buttonLabels}]`;

  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .insert({
      lead_id: lead.id,
      channel: 'whatsapp',
      direction: 'outbound',
      from_number: AI_WA_NUMBER,
      to_number: to,
      message_body: logMsg,
      ai_generated: true,
      ai_intent: aiIntent ?? null,
    })
    .select('id')
    .single();

  if (conv) {
    await storeMessageEmbedding(lead.id, conv.id, logMsg, 'assistant');
  }
}

async function sendListAndLog(
  lead: Lead,
  header: string,
  body: string,
  sections: { title: string; rows: { id: string; title: string; description?: string }[] }[],
  aiIntent?: string
): Promise<void> {
  const to = lead.whatsapp_number!;
  await sendInteractiveList(to, header, body, sections);

  const itemNames = sections.flatMap((s) => s.rows.map((r) => r.title)).join(', ');
  const logMsg = `${header}\n${body}\n[List: ${itemNames}]`;

  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .insert({
      lead_id: lead.id,
      channel: 'whatsapp',
      direction: 'outbound',
      from_number: AI_WA_NUMBER,
      to_number: to,
      message_body: logMsg,
      ai_generated: true,
      ai_intent: aiIntent ?? null,
    })
    .select('id')
    .single();

  if (conv) {
    await storeMessageEmbedding(lead.id, conv.id, logMsg, 'assistant');
  }
}

// ─────────────────────────────────────────────────────────────
// Claude AI response generation
// ─────────────────────────────────────────────────────────────

async function generateAIResponse(
  lead: Lead,
  session: AgentSession,
  userMessage: string,
  additionalContext: string = ''
): Promise<string> {
  const history = await getRelevantHistory(lead.id, userMessage, 10);
  const contextSummary = await getLeadContextSummary(lead.id);

  let therapistInfo = '';
  if (session.current_therapist_id) {
    const { data: therapist } = await supabaseAdmin
      .from('therapists')
      .select('*')
      .eq('id', session.current_therapist_id)
      .single();
    if (therapist) {
      const t = therapist as Therapist;
      therapistInfo = `\nMatched Therapist: ${t.full_name}, specializes in ${t.specialties.join(', ')}, rate: $${(t.session_rate_cents / 100).toFixed(0)}/session`;
    }
  }

  const contextParts: string[] = [];
  if (contextSummary?.summary) contextParts.push(`Lead Summary: ${contextSummary.summary}`);
  if (lead.full_name) contextParts.push(`Client name: ${lead.full_name}`);
  if (lead.presenting_issues?.length) contextParts.push(`Concerns: ${lead.presenting_issues.join(', ')}`);
  if (lead.therapy_type) contextParts.push(`Looking for: ${lead.therapy_type}`);
  contextParts.push(`Session state: ${session.session_state}`);
  if (therapistInfo) contextParts.push(therapistInfo);
  if (additionalContext) contextParts.push(additionalContext);

  const conversationHistory = history.map((h) => ({
    role: h.role === 'user' ? ('user' as const) : ('assistant' as const),
    content: h.content,
  }));

  conversationHistory.push({ role: 'user', content: userMessage });

  // Get state-specific instructions
  const statePrompt = STATE_PROMPTS[session.session_state] ?? '';

  // Shorter max_tokens for confirmed state to reduce hallucination
  const maxTokens = session.session_state === 'confirmed' ? 250 : 400;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: maxTokens,
      system: `${SYSTEM_PROMPT}\n\n=== CURRENT STATE INSTRUCTIONS ===\n${statePrompt}\n\n=== CONTEXT ===\n${contextParts.join('\n')}`,
      messages: conversationHistory,
    });

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    const trimmed = text.trim();

    // Guardrail: check for banned phrases
    return sanitizeResponse(trimmed);
  } catch (err) {
    logger.error('generateAIResponse failed', { error: (err as Error).message });
    return "I'm having a moment \u2014 let me get back to you shortly. \u{1F64F}";
  }
}

// ─────────────────────────────────────────────────────────────
// Response guardrail — catches banned phrases before sending
// ─────────────────────────────────────────────────────────────

function sanitizeResponse(text: string): string {
  const lower = text.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) {
      logger.warn('Banned phrase detected in AI response', {
        phrase,
        originalResponse: text.slice(0, 200),
      });
      return SAFE_FALLBACK;
    }
  }
  return text;
}

// ─────────────────────────────────────────────────────────────
// STATE: greeting — Welcome + therapy type buttons
// ─────────────────────────────────────────────────────────────

async function handleGreeting(
  lead: Lead,
  session: AgentSession,
  messageText: string,
  isNew: boolean,
  interactiveReplyId?: string
): Promise<void> {
  // Check if user mentioned a therapist name
  const therapist = await extractTherapistFromMessage(messageText);
  if (therapist) {
    await updateSession(session.id, {
      session_state: 'slot_request',
      current_therapist_id: therapist.id,
      context_json: { ...session.context_json, mentioned_therapist: therapist.full_name },
    });

    await supabaseAdmin
      .from('leads')
      .update({ matched_therapist_id: therapist.id })
      .eq('id', lead.id);

    // Show therapist profile with confirm buttons
    await showTherapistProfile(lead, therapist);
    return;
  }

  // Check if the message itself is a therapy type selection (text-based)
  const therapyType = extractTherapyType(messageText);
  if (therapyType) {
    await supabaseAdmin.from('leads').update({ therapy_type: therapyType }).eq('id', lead.id);
    await updateSession(session.id, { session_state: 'intake' });
    const updatedLead = { ...lead, therapy_type: therapyType } as Lead;
    await showTherapistList(updatedLead, session);
    return;
  }

  // Send welcome + therapy type buttons
  const firstName = lead.full_name?.split(' ')[0] ?? 'there';
  const welcomeText = isNew
    ? `Hi ${firstName}! \u{1F64F} Welcome to ${PLATFORM_NAME}. I'm Pooja, your AI assistant.\n\nI'm here to help you find the right therapist. What kind of support are you looking for?`
    : `Hi ${firstName}! \u{1F64F} Welcome back to ${PLATFORM_NAME}.\n\nHow can I help you today? What kind of therapy are you looking for?`;

  await sendButtonsAndLog(
    lead,
    welcomeText,
    [
      { id: 'therapy_individual', title: 'Individual Therapy' },
      { id: 'therapy_couples', title: 'Couples Therapy' },
      { id: 'therapy_family', title: 'Family Therapy' },
    ],
    'greeting'
  );

  await updateSession(session.id, { session_state: 'intake' });
}

// ─────────────────────────────────────────────────────────────
// STATE: intake — Handle therapy type selection → therapist list
// ─────────────────────────────────────────────────────────────

async function handleIntake(
  lead: Lead,
  session: AgentSession,
  messageText: string,
  interactiveReplyId?: string
): Promise<void> {
  // Check if user mentioned a therapist name at any point
  const therapist = await extractTherapistFromMessage(messageText);
  if (therapist) {
    await updateSession(session.id, {
      session_state: 'slot_request',
      current_therapist_id: therapist.id,
      context_json: { ...session.context_json, mentioned_therapist: therapist.full_name },
    });

    await supabaseAdmin
      .from('leads')
      .update({ matched_therapist_id: therapist.id })
      .eq('id', lead.id);

    await showTherapistProfile(lead, therapist);
    return;
  }

  // Handle button reply for therapy type
  let therapyType: string | null = null;

  if (interactiveReplyId?.startsWith('therapy_')) {
    therapyType = interactiveReplyId.replace('therapy_', '');
  } else {
    // Try to extract therapy type from text
    therapyType = extractTherapyType(messageText);
  }

  if (therapyType) {
    await supabaseAdmin.from('leads').update({ therapy_type: therapyType }).eq('id', lead.id);
    const updatedLead = { ...lead, therapy_type: therapyType } as Lead;
    await showTherapistList(updatedLead, session);
    return;
  }

  // Could not determine therapy type — re-send buttons
  await sendButtonsAndLog(
    lead,
    `Could you let me know what kind of therapy you're looking for? Please select an option below:`,
    [
      { id: 'therapy_individual', title: 'Individual Therapy' },
      { id: 'therapy_couples', title: 'Couples Therapy' },
      { id: 'therapy_family', title: 'Family Therapy' },
    ],
    'intake_retry'
  );
}

// ─────────────────────────────────────────────────────────────
// STATE: matching — Handle therapist selection from list
// ─────────────────────────────────────────────────────────────

async function handleMatching(
  lead: Lead,
  session: AgentSession,
  messageText: string,
  interactiveReplyId?: string
): Promise<void> {
  let selectedTherapist: Therapist | null = null;

  // Check interactive list reply
  if (interactiveReplyId?.startsWith('therapist_')) {
    const therapistId = interactiveReplyId.replace('therapist_', '');
    const { data: t } = await supabaseAdmin
      .from('therapists')
      .select('*')
      .eq('id', therapistId)
      .single();
    if (t) selectedTherapist = t as Therapist;
  }

  // Check if user typed a therapist name
  if (!selectedTherapist) {
    selectedTherapist = await extractTherapistFromMessage(messageText);
  }

  if (selectedTherapist) {
    await updateSession(session.id, {
      session_state: 'slot_request',
      current_therapist_id: selectedTherapist.id,
    });

    await supabaseAdmin
      .from('leads')
      .update({ matched_therapist_id: selectedTherapist.id, status: 'matched' })
      .eq('id', lead.id);

    await showTherapistProfile(lead, selectedTherapist);
    return;
  }

  // Unrecognized — re-show the therapist list
  await sendAndLog(
    lead,
    `Please select a therapist from the list above, or type their name. If you'd like a different therapy type, reply with "individual", "couples", or "family".`,
    'matching_retry'
  );
}

// ─────────────────────────────────────────────────────────────
// STATE: slot_request — Confirm therapist → contact them
// ─────────────────────────────────────────────────────────────

async function handleSlotRequest(
  lead: Lead,
  session: AgentSession,
  messageText: string,
  interactiveReplyId?: string
): Promise<void> {
  // Handle "show more" button
  if (interactiveReplyId === 'confirm_more' || /^(more|other|different)/i.test(messageText.trim())) {
    await handleMoreOptions(lead, session);
    return;
  }

  // Handle "yes, proceed" button or text
  const isYes =
    interactiveReplyId === 'confirm_yes' ||
    /^(yes|ok|sure|proceed|agree|yeah|yep|yea|haan|ha|ji|1|book|confirm)$/i.test(messageText.trim());

  if (!isYes) {
    // Check if they mentioned a different therapist
    const therapist = await extractTherapistFromMessage(messageText);
    if (therapist) {
      await updateSession(session.id, {
        current_therapist_id: therapist.id,
      });
      await supabaseAdmin
        .from('leads')
        .update({ matched_therapist_id: therapist.id })
        .eq('id', lead.id);
      await showTherapistProfile(lead, therapist);
      return;
    }

    // Unrecognized — re-prompt
    const therapistId = session.current_therapist_id;
    let therapistName = 'the therapist';
    if (therapistId) {
      const { data: t } = await supabaseAdmin.from('therapists').select('full_name').eq('id', therapistId).single();
      if (t) therapistName = t.full_name;
    }

    await sendButtonsAndLog(
      lead,
      `Would you like to proceed with *${therapistName}*?`,
      [
        { id: 'confirm_yes', title: 'Yes, proceed' },
        { id: 'confirm_more', title: 'Show more' },
      ],
      'slot_request_retry'
    );
    return;
  }

  // ── YES — Contact the therapist ─────────────────────────
  const therapistId = session.current_therapist_id;
  if (!therapistId) {
    await sendAndLog(lead, "Let me find a therapist for you first.", 'slot_request_no_therapist');
    await updateSession(session.id, { session_state: 'intake' });
    return;
  }

  const { data: therapist } = await supabaseAdmin
    .from('therapists')
    .select('*')
    .eq('id', therapistId)
    .single();

  if (!therapist) {
    await updateSession(session.id, { session_state: 'intake' });
    return;
  }

  const t = therapist as Therapist;

  // Create appointment
  const { data: appointment, error: aptErr } = await supabaseAdmin
    .from('appointments')
    .insert({
      lead_id: lead.id,
      therapist_id: therapistId,
      status: 'pending_therapist',
      session_duration_min: 60,
      therapist_timezone: t.timezone,
      client_timezone: lead.timezone ?? null,
    })
    .select('*')
    .single();

  if (aptErr || !appointment) {
    logger.error('Failed to create appointment', { error: aptErr?.message });
    await sendAndLog(lead, "Something went wrong. Please try again.", 'error');
    return;
  }

  // Create slot offer record
  await supabaseAdmin.from('slot_offers').insert({
    appointment_id: appointment.id,
    therapist_id: therapistId,
    lead_id: lead.id,
  });

  // Message the therapist with Yes/No buttons
  if (t.whatsapp_number) {
    const clientName = lead.full_name ?? 'A client';
    const clientConcerns = lead.presenting_issues?.join(', ') || lead.pain_summary || 'Not specified';
    const clientTherapyType = lead.therapy_type || 'Not specified';

    const therapistMsg =
      `\u{1F64F} Hi ${t.full_name.split(' ')[0]}!\n\n` +
      `A new client would like to book a session with you.\n\n` +
      `\u{1F464} Client: ${clientName}\n` +
      `\u{1F4CB} Looking for: ${clientTherapyType} therapy\n` +
      `\u{1F4AD} Concern: ${clientConcerns}\n\n` +
      `Are you available to take this client?`;

    await sendInteractiveButtons(t.whatsapp_number, therapistMsg, [
      { id: 'therapist_yes', title: 'Yes, available' },
      { id: 'therapist_no', title: 'Not available' },
    ]);

    // Log outbound to therapist
    await supabaseAdmin.from('conversations').insert({
      therapist_id: therapistId,
      channel: 'whatsapp',
      direction: 'outbound',
      from_number: AI_WA_NUMBER,
      to_number: t.whatsapp_number,
      message_body: therapistMsg,
      ai_generated: true,
      ai_intent: 'availability_request',
    });
  }

  // Tell client we're checking
  await sendAndLog(
    lead,
    `Great choice! \u{1F64F} I've reached out to *${t.full_name}* to check their availability.\n\nWe'll let you know as soon as they respond. This usually takes a few hours.`,
    'checking_availability'
  );

  await updateSession(session.id, {
    session_state: 'slot_relay',
    slot_offer_sent: true,
    context_json: { ...session.context_json, appointment_id: appointment.id },
  });

  await supabaseAdmin
    .from('leads')
    .update({ status: 'slot_offered' })
    .eq('id', lead.id);
}

// ─────────────────────────────────────────────────────────────
// STATE: slot_relay — Waiting for therapist response
// ─────────────────────────────────────────────────────────────

async function handleSlotRelay(
  lead: Lead,
  session: AgentSession,
  messageText: string
): Promise<void> {
  const therapistId = session.current_therapist_id;
  let therapistName = 'your selected therapist';
  if (therapistId) {
    const { data: t } = await supabaseAdmin
      .from('therapists')
      .select('full_name')
      .eq('id', therapistId)
      .single();
    if (t) therapistName = t.full_name;
  }

  await sendAndLog(
    lead,
    `I'm still waiting to hear back from *${therapistName}*. I'll notify you as soon as they confirm their availability. \u{1F64F}\n\nThank you for your patience!`,
    'slot_relay_waiting'
  );
}

// ─────────────────────────────────────────────────────────────
// Therapist message handler (separate from client flow)
// Handles 3 scenarios:
// A) Active slot offer → YES/NO/unrecognized with client details
// B) Recently confirmed session → payment/client info/general
// C) No context → simple acknowledgment
// ─────────────────────────────────────────────────────────────

function clientRefId(leadId: string): string {
  return `IT-${leadId.slice(0, 8).toUpperCase()}`;
}

async function handleTherapistMessage(
  therapist: Therapist,
  messageText: string,
  interactiveReplyId?: string
): Promise<void> {
  const lowerMsg = messageText.trim().toLowerCase();

  // ── SCENARIO A: Check for active (non-expired) slot offer ──
  const { data: slotOffer } = await supabaseAdmin
    .from('slot_offers')
    .select('id, appointment_id, lead_id')
    .eq('therapist_id', therapist.id)
    .eq('is_expired', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (slotOffer) {
    await handleTherapistSlotResponse(therapist, slotOffer, messageText, interactiveReplyId);
    return;
  }

  // ── SCENARIO B: Check for recently confirmed session (last 7 days) ──
  const { data: recentSession } = await supabaseAdmin
    .from('ai_agent_sessions')
    .select('id, lead_id, current_therapist_id, context_json, payment_link, stripe_link_sent')
    .eq('current_therapist_id', therapist.id)
    .eq('session_state', 'confirmed')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (recentSession) {
    const { data: recentLead } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', recentSession.lead_id)
      .single();

    if (recentLead) {
      const rl = recentLead as Lead;
      const refId = clientRefId(rl.id);
      const clientName = rl.full_name ?? 'Client';

      // Therapist asks about payment → auto-send payment link to client
      if (/payment|pay|charge|bill|send payment|invoice|collect|fee/i.test(lowerMsg)) {
        await autoSendPaymentForTherapist(therapist, rl, recentSession);
        return;
      }

      // Therapist asks about client details
      if (/client|details|info|who|name|number/i.test(lowerMsg)) {
        const clientPhone = rl.whatsapp_number ?? rl.phone ?? '';
        const clientConcerns = rl.presenting_issues?.join(', ') || 'Not specified';
        await sendTextMessage(
          therapist.whatsapp_number!,
          `Here are your client details:\n\n` +
          `🆔 ${refId}\n` +
          `👤 *${clientName}*\n` +
          `📱 WhatsApp: ${clientPhone}\n` +
          `💭 Concern: ${clientConcerns}\n\n` +
          `You can reach them directly on WhatsApp. 🙏`
        );
        return;
      }

      // General message from therapist with active client
      await sendTextMessage(
        therapist.whatsapp_number!,
        `Thanks for your message! 🙏\n\n` +
        `Your recent client: *${clientName}* (${refId})\n\n` +
        `Need help? Here's what I can do:\n` +
        `• Say *"send payment"* — I'll send the payment link to ${clientName}\n` +
        `• Say *"client details"* — I'll resend their info\n` +
        `• Say *"SUPPORT"* — Connect with our team`
      );
      return;
    }
  }

  // ── SCENARIO C: No active offers, no recent sessions ──
  logger.info('Therapist message, no active context', { therapistId: therapist.id });
  await sendTextMessage(
    therapist.whatsapp_number!,
    `Thank you for your message! 🙏 There are no pending client requests at the moment. We'll reach out when a new client wants to book with you.`
  );
}

// ─────────────────────────────────────────────────────────────
// Handle therapist response to an active slot offer (YES/NO)
// ─────────────────────────────────────────────────────────────

async function handleTherapistSlotResponse(
  therapist: Therapist,
  slotOffer: { id: string; appointment_id: string; lead_id: string },
  messageText: string,
  interactiveReplyId?: string
): Promise<void> {
  const lowerMsg = messageText.trim().toLowerCase();

  // Get the client lead and session
  const { data: lead } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('id', slotOffer.lead_id)
    .single();

  const { data: session } = await supabaseAdmin
    .from('ai_agent_sessions')
    .select('*')
    .eq('lead_id', slotOffer.lead_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!lead || !session) return;

  const clientName = (lead as Lead).full_name ?? 'Client';
  const clientPhone = (lead as Lead).whatsapp_number ?? (lead as Lead).phone ?? '';
  const clientConcerns = (lead as Lead).presenting_issues?.join(', ') || 'Not specified';
  const clientTherapyType = (lead as Lead).therapy_type || 'Not specified';
  const refId = clientRefId((lead as Lead).id);

  // ── Therapist says YES ──────────────────────────────────
  const isYes =
    interactiveReplyId === 'therapist_yes' ||
    /^(yes|available|accept|sure|ok|can do|ready)/i.test(lowerMsg);

  if (isYes) {
    // Update records
    await supabaseAdmin
      .from('ai_agent_sessions')
      .update({ therapist_confirmed: true, session_state: 'confirmed' })
      .eq('id', session.id);

    // CRITICAL FIX: expire the slot offer so future messages don't re-trigger
    await supabaseAdmin
      .from('slot_offers')
      .update({ is_expired: true, therapist_responded_at: new Date().toISOString() })
      .eq('id', slotOffer.id);

    await supabaseAdmin
      .from('appointments')
      .update({ status: 'confirmed' })
      .eq('id', slotOffer.appointment_id);

    await supabaseAdmin
      .from('leads')
      .update({ status: 'converted' })
      .eq('id', lead.id);

    // Send client: good news + therapist details
    await sendAndLog(
      lead as Lead,
      `Great news! 🎉 *${therapist.full_name}* is available and has confirmed your session!\n\n` +
      `📞 You can now coordinate directly with your therapist:\n` +
      `👩‍⚕️ *${therapist.full_name}*\n` +
      `📱 WhatsApp: ${therapist.whatsapp_number}\n\n` +
      `Please reach out to them to schedule your session time. 🙏`,
      'session_confirmed'
    );

    // Send therapist: client details with reference ID
    await sendTextMessage(
      therapist.whatsapp_number!,
      `✅ Confirmed! Here are the client details:\n\n` +
      `🆔 ${refId}\n` +
      `👤 *${clientName}*\n` +
      `📱 WhatsApp: ${clientPhone}\n` +
      `📋 Looking for: ${clientTherapyType} therapy\n` +
      `💭 Concern: ${clientConcerns}\n\n` +
      `Please reach out to them to schedule the session. Thank you for being part of ${PLATFORM_NAME}! 🙏`
    );

    // Log therapist outbound
    await supabaseAdmin.from('conversations').insert({
      therapist_id: therapist.id,
      channel: 'whatsapp',
      direction: 'outbound',
      from_number: AI_WA_NUMBER,
      to_number: therapist.whatsapp_number,
      message_body: `Client details shared: ${clientName} (${refId})`,
      ai_generated: true,
      ai_intent: 'session_confirmed_therapist',
    });

    // Auto-generate payment link and send to client
    let paymentUrl = '';
    try {
      paymentUrl = await createSessionPaymentLink(
        (lead as Lead).id,
        therapist.id,
        slotOffer.appointment_id
      );

      const rateUsd = (therapist.session_rate_cents / 100).toFixed(0);

      await sendAndLog(
        lead as Lead,
        `💳 Here's your payment link for your session with *${therapist.full_name}* ($${rateUsd}):\n\n` +
        `${paymentUrl}\n\n` +
        `🔒 Secured by Stripe\n` +
        `✅ Once payment is done, please share the confirmation with your therapist.`,
        'payment_link_auto'
      );

      // Update session with payment link
      await supabaseAdmin
        .from('ai_agent_sessions')
        .update({ payment_link: paymentUrl, stripe_link_sent: true })
        .eq('id', session.id);

    } catch (err) {
      logger.error('Auto payment link failed after therapist YES', {
        error: (err as Error).message,
        leadId: (lead as Lead).id,
        therapistId: therapist.id,
      });
    }

    // Notify support team with full details
    await sendTextMessage(
      SUPPORT_WA_NUMBER,
      `🎉 *[CLIENT CONVERTED]*\n\n` +
      `🆔 ${refId}\n` +
      `👤 Client: ${clientName} (${clientPhone})\n` +
      `👩‍⚕️ Therapist: ${therapist.full_name}\n` +
      `📋 Type: ${clientTherapyType} therapy\n` +
      `💭 Concern: ${clientConcerns}\n` +
      (paymentUrl ? `💳 Payment link sent: ${paymentUrl}\n` : `⚠️ Payment link not generated\n`) +
      `\nSession confirmed — details shared with both parties.`
    );

    logger.info('Session confirmed — details + payment shared', {
      leadId: (lead as Lead).id,
      refId,
      therapistId: therapist.id,
      therapistName: therapist.full_name,
      paymentLinkSent: !!paymentUrl,
    });

    return;
  }

  // ── Therapist says NO ───────────────────────────────────
  const isNo =
    interactiveReplyId === 'therapist_no' ||
    /^(no|not available|decline|busy|can'?t|cannot|unavailable)/i.test(lowerMsg);

  if (isNo) {
    await sendTextMessage(
      therapist.whatsapp_number!,
      `No problem! Thank you for letting us know. We'll find another therapist for this client. 🙏`
    );

    await supabaseAdmin.from('conversations').insert({
      therapist_id: therapist.id,
      channel: 'whatsapp',
      direction: 'outbound',
      from_number: AI_WA_NUMBER,
      to_number: therapist.whatsapp_number,
      message_body: `Therapist declined for ${clientName} (${refId})`,
      ai_generated: true,
      ai_intent: 'therapist_declined',
    });

    // Expire this slot offer
    await supabaseAdmin
      .from('slot_offers')
      .update({ is_expired: true, therapist_responded_at: new Date().toISOString() })
      .eq('id', slotOffer.id);

    // Notify client and try next therapist
    await sendAndLog(
      lead as Lead,
      `*${therapist.full_name}* is not available at the moment. Let me find another great therapist for you! 🙏`,
      'therapist_declined_notify'
    );

    // Track this therapist as declined so handleMoreOptions skips them
    const declinedIds: string[] = (session.context_json?.declined_therapist_ids as string[]) ?? [];
    if (!declinedIds.includes(therapist.id)) declinedIds.push(therapist.id);
    await updateSession(session.id, {
      context_json: { ...session.context_json, declined_therapist_ids: declinedIds },
    });

    await handleMoreOptions(lead as Lead, { ...session, context_json: { ...session.context_json, declined_therapist_ids: declinedIds } } as AgentSession);
    return;
  }

  // ── Unrecognized: show client details + re-send buttons ──
  await sendInteractiveButtons(
    therapist.whatsapp_number!,
    `You have a pending booking request:\n\n` +
    `🆔 ${refId}\n` +
    `👤 Client: ${clientName}\n` +
    `📋 Looking for: ${clientTherapyType} therapy\n` +
    `💭 Concern: ${clientConcerns}\n\n` +
    `Are you available for this client?`,
    [
      { id: 'therapist_yes', title: 'Yes, available' },
      { id: 'therapist_no', title: 'Not available' },
    ]
  );
}

// ─────────────────────────────────────────────────────────────
// Auto-send payment link when therapist requests it
// ─────────────────────────────────────────────────────────────

async function autoSendPaymentForTherapist(
  therapist: Therapist,
  clientLead: Lead,
  session: { id: string; lead_id: string; context_json: Record<string, unknown>; payment_link: string | null; stripe_link_sent: boolean }
): Promise<void> {
  const refId = clientRefId(clientLead.id);
  const clientName = clientLead.full_name ?? 'Client';

  // Check if payment link already sent
  if (session.stripe_link_sent && session.payment_link) {
    await sendTextMessage(
      therapist.whatsapp_number!,
      `✅ Payment link was already sent to *${clientName}* (${refId}):\n\n💳 ${session.payment_link}\n\nThey should have received it on WhatsApp. 🙏`
    );
    return;
  }

  // Find the appointment for this session
  const appointmentId = session.context_json?.appointment_id as string | undefined;
  if (!appointmentId) {
    await sendTextMessage(
      therapist.whatsapp_number!,
      `I couldn't find the booking details to generate a payment link. Let me connect you with support. Please type *SUPPORT*. 🙏`
    );
    return;
  }

  try {
    const paymentUrl = await createSessionPaymentLink(clientLead.id, therapist.id, appointmentId);
    const rateUsd = (therapist.session_rate_cents / 100).toFixed(0);

    // Send payment link to client
    await sendAndLog(
      clientLead,
      `💳 Here's your payment link for your session with *${therapist.full_name}* ($${rateUsd}):\n\n` +
      `${paymentUrl}\n\n` +
      `🔒 Secured by Stripe\n` +
      `✅ Once payment is done, please share the confirmation with your therapist.`,
      'payment_link_therapist_requested'
    );

    // Update session
    await supabaseAdmin
      .from('ai_agent_sessions')
      .update({ payment_link: paymentUrl, stripe_link_sent: true })
      .eq('id', session.id);

    // Confirm to therapist
    await sendTextMessage(
      therapist.whatsapp_number!,
      `✅ Payment link ($${rateUsd}) sent to *${clientName}* (${refId}) on WhatsApp! 🙏`
    );

    // Notify support
    await sendTextMessage(
      SUPPORT_WA_NUMBER,
      `💳 *[PAYMENT LINK SENT]*\n\n` +
      `🆔 ${refId}\n` +
      `👤 Client: ${clientName}\n` +
      `👩‍⚕️ Therapist: ${therapist.full_name}\n` +
      `💰 Amount: $${rateUsd}\n` +
      `💳 Link: ${paymentUrl}\n\n` +
      `Requested by therapist.`
    );

    logger.info('Payment link sent (therapist request)', {
      leadId: clientLead.id,
      refId,
      therapistId: therapist.id,
    });
  } catch (err) {
    logger.error('autoSendPaymentForTherapist failed', { error: (err as Error).message });
    await sendTextMessage(
      therapist.whatsapp_number!,
      `I'm having trouble generating the payment link. Our support team will help — please type *SUPPORT*. 🙏`
    );
  }
}

// ─────────────────────────────────────────────────────────────
// STATE: confirmed — Intent detection + template responses
// ─────────────────────────────────────────────────────────────

const PAYMENT_KEYWORDS = /pay|payment|cost|fee|how much|price|rate|invoice|bill|charge|amount|stripe/i;
const SCHEDULING_KEYWORDS = /when|schedule|time|slot|available|availability|calendar|appointment|session time|next step/i;
const CONTACT_KEYWORDS = /contact|number|phone|reach|whatsapp|details|therapist number/i;
const SWITCH_KEYWORDS = /different|change|another|switch|new therapist|other therapist/i;
const CANCEL_KEYWORDS = /cancel|reschedule|postpone/i;
const THANKS_KEYWORDS = /thank|thanks|great|awesome|perfect|good|wonderful|amazing/i;
const HOW_IT_WORKS_KEYWORDS = /how does|how do|how it works|what happens|process|explain/i;

async function handleConfirmed(
  lead: Lead,
  session: AgentSession,
  messageText: string
): Promise<void> {
  const lower = messageText.toLowerCase();

  // 1. Payment intent → auto-generate Stripe payment link
  if (PAYMENT_KEYWORDS.test(lower)) {
    await handlePaymentRequest(lead, session);
    return;
  }

  // 2. Scheduling/availability → template: coordinate with therapist
  if (SCHEDULING_KEYWORDS.test(lower)) {
    const { name, phone } = await getTherapistDetails(session);
    await sendAndLog(
      lead,
      `You can coordinate your session timing directly with *${name}* on WhatsApp: ${phone}\n\nThey'll work out a time that suits both of you. 🙏`,
      'confirmed_scheduling'
    );
    return;
  }

  // 3. Contact re-request → re-send therapist details
  if (CONTACT_KEYWORDS.test(lower)) {
    const { name, phone } = await getTherapistDetails(session);
    await sendAndLog(
      lead,
      `Here are your therapist's details:\n\n👩‍⚕️ *${name}*\n📱 WhatsApp: ${phone}\n\nYou can message them directly to coordinate your session. 🙏`,
      'confirmed_contact'
    );
    return;
  }

  // 4. Switch therapist → reset to intake
  if (SWITCH_KEYWORDS.test(lower)) {
    await sendAndLog(
      lead,
      `Of course! Let me help you find a different therapist.`,
      'confirmed_switch'
    );
    await updateSession(session.id, { session_state: 'intake' });
    await showTherapistList(lead, session);
    return;
  }

  // 5. Cancel/reschedule → template
  if (CANCEL_KEYWORDS.test(lower)) {
    const { name, phone } = await getTherapistDetails(session);
    await sendAndLog(
      lead,
      `To reschedule or cancel, please message *${name}* directly: ${phone}\n\nNeed more help? Type *SUPPORT*. 🙏`,
      'confirmed_cancel'
    );
    return;
  }

  // 6. Thank you → warm template
  if (THANKS_KEYWORDS.test(lower)) {
    await sendAndLog(
      lead,
      `You're welcome! 🙏 Wishing you a wonderful session. If you need anything else, I'm here to help.`,
      'confirmed_thanks'
    );
    return;
  }

  // 7. How it works → FAQ response
  if (HOW_IT_WORKS_KEYWORDS.test(lower)) {
    await sendAndLog(lead, FAQ_RESPONSES.how_it_works, 'confirmed_faq');
    return;
  }

  // 8. Fallback → Claude with tight guardrails
  const aiReply = await generateAIResponse(
    lead,
    session,
    messageText,
    STATE_PROMPTS.confirmed
  );
  await sendAndLog(lead, aiReply, 'confirmed_ai');
}

// ─────────────────────────────────────────────────────────────
// Payment link auto-generation
// ─────────────────────────────────────────────────────────────

async function handlePaymentRequest(
  lead: Lead,
  session: AgentSession
): Promise<void> {
  const therapistId = session.current_therapist_id;
  const appointmentId = session.context_json?.appointment_id as string | undefined;

  if (!therapistId || !appointmentId) {
    await sendAndLog(
      lead,
      `Let me connect you with our support team for payment assistance. Type *SUPPORT* or I'll transfer you now. 🙏`,
      'payment_no_context'
    );
    return;
  }

  // Check if we already sent a payment link
  if (session.stripe_link_sent && session.payment_link) {
    const { name } = await getTherapistDetails(session);
    await sendAndLog(
      lead,
      `Here's your payment link for your session with *${name}*:\n\n💳 ${session.payment_link}\n\n🔒 Secured by Stripe`,
      'payment_link_resent'
    );
    return;
  }

  try {
    const paymentUrl = await createSessionPaymentLink(lead.id, therapistId, appointmentId);

    // Fetch therapist for name and rate
    const { data: therapist } = await supabaseAdmin
      .from('therapists')
      .select('full_name, session_rate_cents')
      .eq('id', therapistId)
      .single();

    const rateUsd = therapist ? `$${(therapist.session_rate_cents / 100).toFixed(0)}` : '';
    const therapistName = therapist?.full_name ?? 'your therapist';

    await sendAndLog(
      lead,
      `Here's your secure payment link for your session with *${therapistName}* (${rateUsd}):\n\n💳 ${paymentUrl}\n\n🔒 Secured by Stripe\n✅ You'll receive a confirmation once payment is complete.`,
      'payment_link_sent'
    );

    await updateSession(session.id, {
      payment_link: paymentUrl,
      stripe_link_sent: true,
    });
  } catch (err) {
    logger.error('handlePaymentRequest failed', { error: (err as Error).message });
    await sendAndLog(
      lead,
      `I'm having trouble generating your payment link. Let me connect you with support. 🙏`,
      'payment_error'
    );
    await escalateToHuman(lead, session, 'Payment link generation failed', `Error: ${(err as Error).message}`);
  }
}

// ─────────────────────────────────────────────────────────────
// Get therapist name + phone for templates
// ─────────────────────────────────────────────────────────────

async function getTherapistDetails(
  session: AgentSession
): Promise<{ name: string; phone: string }> {
  if (!session.current_therapist_id) {
    return { name: 'your therapist', phone: 'their WhatsApp number' };
  }
  const { data: t } = await supabaseAdmin
    .from('therapists')
    .select('full_name, whatsapp_number')
    .eq('id', session.current_therapist_id)
    .single();
  return {
    name: t?.full_name ?? 'your therapist',
    phone: t?.whatsapp_number ?? 'their WhatsApp number',
  };
}

// ─────────────────────────────────────────────────────────────
// STATE: escalated — Forward to support silently
// ─────────────────────────────────────────────────────────────

async function handleEscalated(
  lead: Lead,
  _session: AgentSession,
  messageText: string
): Promise<void> {
  const clientName = lead.full_name ?? lead.whatsapp_number ?? 'Unknown';

  await sendTextMessage(
    SUPPORT_WA_NUMBER,
    `\u{26A0}\u{FE0F} *[ESCALATED]*\n\n` +
    `\u{1F464} Client: ${clientName} (${lead.whatsapp_number})\n` +
    `\u{1F4AC} Message: ${messageText}\n\n` +
    `Please respond to them directly.`
  );

  logger.info('Escalated message forwarded to support', {
    leadId: lead.id,
    fromNumber: lead.whatsapp_number,
  });
}

// ─────────────────────────────────────────────────────────────
// Escalation helper
// ─────────────────────────────────────────────────────────────

async function escalateToHuman(
  lead: Lead,
  session: AgentSession,
  messageText: string,
  reason: string
): Promise<void> {
  await supabaseAdmin.from('manual_escalations').insert({
    lead_id: lead.id,
    reason,
    ai_last_message: messageText,
    status: 'pending',
    assigned_to: 'support',
  });

  await updateSession(session.id, {
    session_state: 'escalated',
    escalated_to_human: true,
    escalation_reason: reason,
  });

  const clientName = lead.full_name ?? 'Unknown';
  await sendTextMessage(
    SUPPORT_WA_NUMBER,
    `\u{26A0}\u{FE0F} *[ESCALATION]*\n\n` +
    `\u{1F464} Client: ${clientName} (${lead.whatsapp_number})\n` +
    `\u{1F4CB} Reason: ${reason}\n` +
    `\u{1F4AC} Last message: ${messageText}\n\n` +
    `Please respond to them.`
  );

  await sendAndLog(
    lead,
    `I'm connecting you with our support team. Someone will respond shortly. \u{1F64F}\n\nFor urgent matters, WhatsApp us at: ${SUPPORT_WA_NUMBER}`,
    'escalation'
  );

  logger.info('Lead escalated to human', { leadId: lead.id, reason });
}

// ─────────────────────────────────────────────────────────────
// Show therapist list (interactive list message)
// ─────────────────────────────────────────────────────────────

async function showTherapistList(
  lead: Lead,
  session: AgentSession
): Promise<void> {
  // Use AI matcher to find best matches
  let therapists: Therapist[] = [];

  try {
    therapists = await matchTherapists(lead);
  } catch (err) {
    logger.warn('matchTherapists failed, using fallback', { error: (err as Error).message });
  }

  // Fallback: get first 5 active therapists
  if (therapists.length === 0) {
    const { data: fallback } = await supabaseAdmin
      .from('therapists')
      .select('*')
      .eq('is_active', true)
      .limit(5);
    therapists = (fallback ?? []) as Therapist[];
  }

  if (therapists.length === 0) {
    await sendAndLog(
      lead,
      `We're currently updating our therapist directory. Our team will reach out with personalized recommendations shortly. \u{1F64F}`,
      'no_therapists'
    );
    await escalateToHuman(lead, session, 'No active therapists found', 'System: no therapists available');
    return;
  }

  // Build interactive list
  const rows = therapists.slice(0, 10).map((t) => ({
    id: `therapist_${t.id}`,
    title: t.full_name.slice(0, 24),
    description: `${t.specialties?.[0] ?? 'General'} \u{00B7} $${(t.session_rate_cents / 100).toFixed(0)}/session`.slice(0, 72),
  }));

  const therapyLabel = lead.therapy_type
    ? `${lead.therapy_type.charAt(0).toUpperCase() + lead.therapy_type.slice(1)} therapy`
    : 'Therapy';

  await sendListAndLog(
    lead,
    'Choose a Therapist',
    `Here are our recommended therapists for ${therapyLabel.toLowerCase()}. Tap below to see the list and select your preferred therapist:`,
    [{ title: 'Recommended Therapists', rows }],
    'therapist_list'
  );

  await updateSession(session.id, { session_state: 'matching' });
}

// ─────────────────────────────────────────────────────────────
// Show therapist profile with confirm buttons
// ─────────────────────────────────────────────────────────────

async function showTherapistProfile(
  lead: Lead,
  therapist: Therapist
): Promise<void> {
  const rateUsd = (therapist.session_rate_cents / 100).toFixed(0);
  const firstName = lead.full_name?.split(' ')[0] ?? 'there';

  const profileMsg =
    `${firstName}, here's your selected therapist:\n\n` +
    `\u{1F469}\u{200D}\u{2695}\u{FE0F} *${therapist.full_name}*\n` +
    `\u{1F3AF} Specializes in: ${therapist.specialties.slice(0, 3).join(', ')}\n` +
    `\u{1F5E3}\u{FE0F} Languages: ${therapist.languages.join(', ')}\n` +
    `\u{23F1}\u{FE0F} Experience: ${therapist.experience_years ?? '5+'} years\n` +
    `\u{1F4B0} Rate: $${rateUsd}/session (60 min)\n\n` +
    `Would you like to proceed with ${therapist.full_name.split(' ')[0]}?`;

  await sendButtonsAndLog(
    lead,
    profileMsg,
    [
      { id: 'confirm_yes', title: 'Yes, proceed' },
      { id: 'confirm_more', title: 'Show more' },
    ],
    'therapist_profile'
  );
}

// ─────────────────────────────────────────────────────────────
// Handle "more options" — find next therapist
// ─────────────────────────────────────────────────────────────

async function handleMoreOptions(
  lead: Lead,
  session: AgentSession
): Promise<void> {
  // Collect all therapist IDs to exclude (declined + current)
  const declinedIds: string[] = (session.context_json?.declined_therapist_ids as string[]) ?? [];
  const excludeIds = new Set<string>(declinedIds);
  if (session.current_therapist_id) excludeIds.add(session.current_therapist_id);

  const { data: refreshedLead } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('id', lead.id)
    .single();

  const matched = await matchTherapists((refreshedLead as Lead) || lead);
  const nextTherapist = matched.find((t) => !excludeIds.has(t.id));

  if (nextTherapist) {
    await updateSession(session.id, {
      session_state: 'slot_request',
      current_therapist_id: nextTherapist.id,
    });

    await supabaseAdmin
      .from('leads')
      .update({ matched_therapist_id: nextTherapist.id })
      .eq('id', lead.id);

    await showTherapistProfile((refreshedLead as Lead) || lead, nextTherapist);
  } else {
    // No more auto-matched options — send therapist directory link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://web-production-7bea1.up.railway.app';
    await sendAndLog(
      lead,
      `I've checked our best therapist matches but none are available right now. 🙏\n\n` +
      `You can browse our full therapist directory and pick someone who feels right for you:\n\n` +
      `🔗 ${appUrl}/therapists\n\n` +
      `Once you find a therapist you like, click *Book a Session* on their profile and fill in your details — we'll contact them right away!`,
      'no_more_options_directory'
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Extract therapist name from message (fuzzy matching)
// ─────────────────────────────────────────────────────────────

async function extractTherapistFromMessage(
  messageText: string
): Promise<Therapist | null> {
  const { data: therapists } = await supabaseAdmin
    .from('therapists')
    .select('*')
    .eq('is_active', true);

  if (!therapists) return null;

  const lowerMsg = messageText.toLowerCase();

  for (const t of therapists as Therapist[]) {
    const fullName = t.full_name.toLowerCase();
    const nameParts = fullName.split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

    // Match on full name, first name (4+ chars), or last name (4+ chars)
    if (
      lowerMsg.includes(fullName) ||
      (firstName.length >= 4 && lowerMsg.includes(firstName)) ||
      (lastName.length >= 4 && lowerMsg.includes(lastName))
    ) {
      return t;
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// Extract therapy type from free text
// ─────────────────────────────────────────────────────────────

function extractTherapyType(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes('individual') || lower.includes('personal') || lower.includes('solo') || lower.includes('myself')) {
    return 'individual';
  }
  if (lower.includes('couple') || lower.includes('marriage') || lower.includes('partner') || lower.includes('relationship')) {
    return 'couples';
  }
  if (lower.includes('family') || lower.includes('parent') || lower.includes('child')) {
    return 'family';
  }
  return null;
}
