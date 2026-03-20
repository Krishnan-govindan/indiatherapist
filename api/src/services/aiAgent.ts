// ─────────────────────────────────────────────────────────────
// AI Agent — Full Agentic Workflow Engine
//
// Handles the complete WhatsApp conversation lifecycle:
// greeting → intake → matching → slot_request → slot_relay
// → payment_sent → confirmed → escalated
//
// Uses Claude Haiku for all AI responses (fast + cheap).
// Does NOT modify existing webhook handlers, Stripe webhook,
// or any existing routes.
// ─────────────────────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';
import { sendTextMessage, markMessageRead } from '../services/whatsapp';
import { matchTherapists } from '../services/aiMatcher';
import { createPaymentLink } from '../services/stripeService';
import {
  storeMessageEmbedding,
  getRelevantHistory,
  getLeadContextSummary,
  updateLeadContextSummary,
} from '../services/embeddingService';
import type { Therapist, Lead, Appointment } from '../lib/types';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const AI_WA_NUMBER = process.env.AI_WA_NUMBER ?? '+18568782862';
const SUPPORT_WA_NUMBER = process.env.SUPPORT_WA_NUMBER ?? '+14254424167';
const PLATFORM_NAME = 'India Therapist';

const SYSTEM_PROMPT = `You are Pooja, the AI assistant for ${PLATFORM_NAME} — the only online therapy platform dedicated to NRIs (Non-Resident Indians). You help clients find and book therapy sessions with Indian therapists.

Your personality: Warm, empathetic, culturally aware, professional. Never sound robotic. Speak like a caring friend who understands NRI struggles.

Rules:
1. Always address the client by their first name if known
2. If client mentions a specific therapist by name, match to the therapist list
3. Never share therapist personal phone numbers with clients directly
4. If you cannot help (refund, complaint, crisis), escalate to human support
5. Payment must happen BEFORE confirming any session
6. Always respond in the same language the client writes in
7. Keep responses concise — this is WhatsApp, not email
8. Use emoji sparingly and naturally
9. Be culturally sensitive to Indian values and NRI experiences`;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─────────────────────────────────────────────────────────────
// Escalation keywords
// ─────────────────────────────────────────────────────────────

const ESCALATION_KEYWORDS = [
  'refund', 'money back', 'charge', 'fraud', 'complaint',
  'emergency', 'crisis', 'suicide', 'harm', 'self-harm',
  'wrong', 'problem', 'issue', 'not working', 'broken',
];

const AFFIRMATIVE_PATTERNS = /^(yes|ok|sure|proceed|agree|yeah|yep|yea|haan|ha|ji|1)$/i;

// ─────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────

export async function processIncomingMessage(
  fromNumber: string,
  messageText: string,
  messageId: string,
  messageType: string // text | audio | image | document
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
      // Log therapist message to conversations (no lead_id)
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

      await handleTherapistMessage(therapistSender as Therapist, messageText);
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

    // ── Check for SUPPORT keyword first ────────────────────────
    if (messageText.trim().toUpperCase() === 'SUPPORT') {
      await escalateToHuman(lead, session, messageText, 'Client requested support');
      return;
    }

    // ── Check escalation triggers ──────────────────────────────
    const lowerMsg = messageText.toLowerCase();
    const escalationMatch = ESCALATION_KEYWORDS.find((kw) => lowerMsg.includes(kw));
    if (escalationMatch) {
      await escalateToHuman(lead, session, messageText, `Keyword detected: "${escalationMatch}"`);
      return;
    }

    // ── STEP D: Route by session state ─────────────────────────
    switch (session.session_state) {
      case 'greeting':
        await handleGreeting(lead, session, messageText, isNew);
        break;
      case 'intake':
        await handleIntake(lead, session, messageText);
        break;
      case 'matching':
        await handleMatching(lead, session, messageText);
        break;
      case 'slot_request':
        await handleSlotRequest(lead, session, messageText);
        break;
      case 'slot_relay':
        await handleSlotRelay(lead, session, messageText);
        break;
      case 'payment_sent':
        await handlePaymentSent(lead, session, messageText);
        break;
      case 'confirmed':
        await handleConfirmed(lead, session, messageText);
        break;
      case 'escalated':
        await handleEscalated(lead, session, messageText);
        break;
      default:
        await handleGreeting(lead, session, messageText, isNew);
    }

    // ── STEP F: Update context summary periodically ────────────
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
// Lead management
// ─────────────────────────────────────────────────────────────

async function getOrCreateLead(
  fromNumber: string
): Promise<{ lead: Lead; isNew: boolean }> {
  const { data: existing } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('whatsapp_number', fromNumber)
    .single();

  if (existing) {
    return { lead: existing as Lead, isNew: false };
  }

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
// Send AI response + log it
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

// ─────────────────────────────────────────────────────────────
// Claude AI response generation
// ─────────────────────────────────────────────────────────────

async function generateAIResponse(
  lead: Lead,
  session: AgentSession,
  userMessage: string,
  additionalContext: string = ''
): Promise<string> {
  // Build context
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
      therapistInfo = `\nMatched Therapist: ${t.full_name}, ${t.experience_years ?? '5+'} years experience, specializes in ${t.specialties.join(', ')}, speaks ${t.languages.join(', ')}, rate: $${(t.session_rate_cents / 100).toFixed(0)}/session`;
    }
  }

  const contextParts: string[] = [];
  if (contextSummary?.summary) {
    contextParts.push(`Lead Summary: ${contextSummary.summary}`);
  }
  if (lead.full_name) contextParts.push(`Client name: ${lead.full_name}`);
  if (lead.presenting_issues?.length) contextParts.push(`Concerns: ${lead.presenting_issues.join(', ')}`);
  if (lead.therapy_type) contextParts.push(`Looking for: ${lead.therapy_type}`);
  if (lead.country) contextParts.push(`Country: ${lead.country}`);
  contextParts.push(`Session state: ${session.session_state}`);
  if (therapistInfo) contextParts.push(therapistInfo);
  if (additionalContext) contextParts.push(additionalContext);

  const conversationHistory = history.map((h) => ({
    role: h.role === 'user' ? 'user' as const : 'assistant' as const,
    content: h.content,
  }));

  // Add current message
  conversationHistory.push({ role: 'user', content: userMessage });

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 500,
      system: `${SYSTEM_PROMPT}\n\n=== CONTEXT ===\n${contextParts.join('\n')}`,
      messages: conversationHistory,
    });

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    return text.trim();
  } catch (err) {
    logger.error('generateAIResponse failed', { error: (err as Error).message });
    return "I'm having a moment — let me get back to you shortly. 🙏";
  }
}

// ─────────────────────────────────────────────────────────────
// STATE: greeting
// ─────────────────────────────────────────────────────────────

async function handleGreeting(
  lead: Lead,
  session: AgentSession,
  messageText: string,
  isNew: boolean
): Promise<void> {
  // Try to extract therapist name from the message
  const therapist = await extractTherapistFromMessage(messageText);

  if (therapist) {
    // Client mentioned a specific therapist — skip intake
    await updateSession(session.id, {
      session_state: 'matching',
      current_therapist_id: therapist.id,
      context_json: { ...session.context_json, mentioned_therapist: therapist.full_name },
    });

    // Update lead with matched therapist
    await supabaseAdmin
      .from('leads')
      .update({ matched_therapist_id: therapist.id })
      .eq('id', lead.id);

    // Refresh lead
    const { data: updatedLead } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', lead.id)
      .single();

    await handleMatching(updatedLead as Lead || lead, { ...session, session_state: 'matching', current_therapist_id: therapist.id }, messageText);
    return;
  }

  // Check if lead already has info (returning user)
  if (!isNew && lead.full_name && lead.presenting_issues?.length > 0) {
    // Existing lead with data — go to intake to ask what they need now
    const firstName = lead.full_name.split(' ')[0];
    await sendAndLog(
      lead,
      `Hi ${firstName}! 🙏 Welcome back to ${PLATFORM_NAME}.\n\nHow can I help you today? Are you looking to book another session or do you have something new on your mind?`,
      'greeting_returning'
    );
    await updateSession(session.id, { session_state: 'intake' });
    return;
  }

  // New lead — send welcome and move to intake
  const name = lead.full_name?.split(' ')[0] ?? 'there';
  await sendAndLog(
    lead,
    `Hi ${name}! 🙏 Welcome to ${PLATFORM_NAME}. I'm Pooja, your AI assistant.\n\nI'm here to help you find the right therapist. To get started, could you tell me:\n\n1. What kind of support are you looking for? (individual, couples, or family therapy)\n2. What's been on your mind lately?`,
    'greeting_new'
  );

  await updateSession(session.id, { session_state: 'intake' });
}

// ─────────────────────────────────────────────────────────────
// STATE: intake
// ─────────────────────────────────────────────────────────────

async function handleIntake(
  lead: Lead,
  session: AgentSession,
  messageText: string
): Promise<void> {
  // Use Claude to extract intake info
  const extracted = await extractIntakeInfo(messageText);

  // Update lead with extracted info
  const updates: Record<string, unknown> = {};
  if (extracted.therapy_type) updates.therapy_type = extracted.therapy_type;
  if (extracted.concerns?.length) updates.presenting_issues = extracted.concerns;
  if (extracted.pain_summary) updates.pain_summary = extracted.pain_summary;
  if (extracted.urgency) updates.urgency = extracted.urgency;

  if (Object.keys(updates).length > 0) {
    await supabaseAdmin.from('leads').update(updates).eq('id', lead.id);
  }

  // Check if we have enough info to match
  const hasTherapyType = extracted.therapy_type || lead.therapy_type;
  const hasConcerns = (extracted.concerns?.length ?? 0) > 0 || (lead.presenting_issues?.length ?? 0) > 0;

  if (hasTherapyType && hasConcerns) {
    // Enough info — run matcher
    const { data: refreshedLead } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', lead.id)
      .single();

    const matched = await matchTherapists(refreshedLead as Lead || lead);

    if (matched.length > 0) {
      await updateSession(session.id, {
        session_state: 'matching',
        current_therapist_id: matched[0].id,
      });

      await handleMatching(
        refreshedLead as Lead || lead,
        { ...session, session_state: 'matching', current_therapist_id: matched[0].id },
        messageText
      );
      return;
    }
  }

  // Need more info — ask follow-up via AI
  const aiReply = await generateAIResponse(
    lead,
    session,
    messageText,
    'You are in intake mode. Gently ask for any missing information: therapy type (individual/couples/family), main concerns, and preferred language. Be warm and empathetic.'
  );
  await sendAndLog(lead, aiReply, 'intake');
}

// ─────────────────────────────────────────────────────────────
// STATE: matching
// ─────────────────────────────────────────────────────────────

async function handleMatching(
  lead: Lead,
  session: AgentSession,
  _messageText: string
): Promise<void> {
  const therapistId = session.current_therapist_id;
  if (!therapistId) {
    logger.warn('handleMatching: no therapist ID in session', { sessionId: session.id });
    await updateSession(session.id, { session_state: 'intake' });
    return;
  }

  const { data: therapist } = await supabaseAdmin
    .from('therapists')
    .select('*')
    .eq('id', therapistId)
    .single();

  if (!therapist) {
    logger.warn('handleMatching: therapist not found', { therapistId });
    await updateSession(session.id, { session_state: 'intake' });
    return;
  }

  const t = therapist as Therapist;
  const rateUsd = (t.session_rate_cents / 100).toFixed(0);
  const firstName = lead.full_name?.split(' ')[0] ?? 'there';

  const message =
    `${firstName}, I think *${t.full_name}* would be a wonderful match for you! 🙏\n\n` +
    `👩‍⚕️ *${t.full_name}* — ${t.experience_years ?? '5+'} years experience\n` +
    `🎯 Specializes in: ${t.specialties.slice(0, 3).join(', ')}\n` +
    `🗣️ Languages: ${t.languages.join(', ')}\n` +
    `💰 Rate: $${rateUsd}/session (60 min)\n\n` +
    `Shall I check their availability for you?\n` +
    `Reply *YES* to proceed or *MORE* to see other options.`;

  await sendAndLog(lead, message, 'matching');

  await updateSession(session.id, { session_state: 'slot_request' });

  await supabaseAdmin
    .from('leads')
    .update({ status: 'matched', matched_therapist_id: therapistId })
    .eq('id', lead.id);
}

// ─────────────────────────────────────────────────────────────
// STATE: slot_request
// ─────────────────────────────────────────────────────────────

async function handleSlotRequest(
  lead: Lead,
  session: AgentSession,
  messageText: string
): Promise<void> {
  const lowerMsg = messageText.trim().toLowerCase();

  // Check for "more" / "other"
  if (lowerMsg === 'more' || lowerMsg.includes('other option') || lowerMsg === '2') {
    await handleMoreOptions(lead, session);
    return;
  }

  // Check for affirmative
  if (AFFIRMATIVE_PATTERNS.test(messageText.trim())) {
    const therapistId = session.current_therapist_id;
    if (!therapistId) {
      await sendAndLog(lead, "Let me find a therapist for you first. What kind of support are you looking for?", 'slot_request_no_therapist');
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
      await sendAndLog(lead, "Something went wrong. Let me try again — please reply YES once more.", 'error');
      return;
    }

    // Create slot offer
    await supabaseAdmin.from('slot_offers').insert({
      appointment_id: appointment.id,
      therapist_id: therapistId,
      lead_id: lead.id,
    });

    // Message therapist
    if (t.whatsapp_number) {
      const clientConcerns = lead.presenting_issues?.join(', ') || lead.pain_summary || 'Not specified';
      const clientLanguages = lead.preferred_languages?.join(', ') || 'Not specified';
      const clientCountry = lead.country || 'Not specified';

      const therapistMsg =
        `🙏 Hi ${t.full_name.split(' ')[0]}! A new client is requesting a session with you.\n\n` +
        `👤 Client concern: ${clientConcerns}\n` +
        `🗣️ Language: ${clientLanguages}\n` +
        `🌏 Country: ${clientCountry}\n\n` +
        `Are you available to take this client?\n` +
        `Reply *YES* to accept or *NO* to decline.`;

      await sendTextMessage(t.whatsapp_number, therapistMsg);

      // Log outbound to therapist
      await supabaseAdmin.from('conversations').insert({
        therapist_id: therapistId,
        channel: 'whatsapp',
        direction: 'outbound',
        from_number: AI_WA_NUMBER,
        to_number: t.whatsapp_number,
        message_body: therapistMsg,
        ai_generated: true,
        ai_intent: 'slot_request_to_therapist',
      });
    }

    // Message client
    await sendAndLog(
      lead,
      `Great! I've reached out to ${t.full_name} to check their availability. You'll hear back within a few hours. 🙏`,
      'slot_request_sent'
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

    return;
  }

  // Unrecognized response — use AI
  const aiReply = await generateAIResponse(
    lead,
    session,
    messageText,
    'The client was just shown a therapist match and asked to reply YES to proceed or MORE for other options. Help them decide.'
  );
  await sendAndLog(lead, aiReply, 'slot_request_ai');
}

// ─────────────────────────────────────────────────────────────
// STATE: slot_relay — handles both therapist and client replies
// ─────────────────────────────────────────────────────────────

async function handleSlotRelay(
  lead: Lead,
  session: AgentSession,
  messageText: string
): Promise<void> {
  const lowerMsg = messageText.trim().toLowerCase();

  // Check if client is selecting a slot (1, 2, or 3)
  const slotMatch = messageText.trim().match(/^[1-3]$/);
  if (slotMatch) {
    await handleSlotSelection(lead, session, parseInt(slotMatch[0]));
    return;
  }

  // Otherwise, AI response about waiting for therapist
  const therapistId = session.current_therapist_id;
  let therapistName = 'your therapist';
  if (therapistId) {
    const { data: t } = await supabaseAdmin
      .from('therapists')
      .select('full_name')
      .eq('id', therapistId)
      .single();
    if (t) therapistName = t.full_name;
  }

  if (lowerMsg === 'status' || lowerMsg.includes('update') || lowerMsg.includes('when')) {
    await sendAndLog(
      lead,
      `I'm still waiting to hear back from ${therapistName}. I'll notify you as soon as they respond with available time slots. 🙏`,
      'slot_relay_status'
    );
    return;
  }

  const aiReply = await generateAIResponse(
    lead,
    session,
    messageText,
    `You are waiting for therapist ${therapistName} to respond with availability. The client is asking something while waiting. Be helpful and reassuring.`
  );
  await sendAndLog(lead, aiReply, 'slot_relay_ai');
}

// Handle therapist messages (separate flow from client)
async function handleTherapistMessage(
  therapist: Therapist,
  messageText: string
): Promise<void> {
  const lowerMsg = messageText.trim().toLowerCase();

  // Find the most recent slot offer for this therapist
  const { data: slotOffer } = await supabaseAdmin
    .from('slot_offers')
    .select('id, appointment_id, lead_id')
    .eq('therapist_id', therapist.id)
    .eq('is_expired', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!slotOffer) {
    logger.info('Therapist message but no open slot offer', { therapistId: therapist.id });
    return;
  }

  // Get the agent session for this lead
  const { data: session } = await supabaseAdmin
    .from('ai_agent_sessions')
    .select('*')
    .eq('lead_id', slotOffer.lead_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!session) return;

  const { data: lead } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('id', slotOffer.lead_id)
    .single();

  if (!lead) return;

  // Therapist says YES
  if (/^(yes|available|accept|sure|ok|can do)/i.test(lowerMsg)) {
    await supabaseAdmin
      .from('ai_agent_sessions')
      .update({ therapist_confirmed: true })
      .eq('id', session.id);

    await sendTextMessage(
      therapist.whatsapp_number!,
      `✅ Thank you! Please share 2-3 available time slots.\n\nFormat: DD/MM at HH:MM IST\n(e.g., 25/03 at 10:00 IST)`
    );

    // Log
    await supabaseAdmin.from('conversations').insert({
      therapist_id: therapist.id,
      channel: 'whatsapp',
      direction: 'outbound',
      from_number: AI_WA_NUMBER,
      to_number: therapist.whatsapp_number,
      message_body: 'Requested time slots from therapist',
      ai_generated: true,
      ai_intent: 'request_slots',
    });

    return;
  }

  // Therapist says NO
  if (/^(no|not available|decline|busy|can'?t|cannot)/i.test(lowerMsg)) {
    await sendTextMessage(
      therapist.whatsapp_number!,
      `No problem! Thank you for letting us know. We'll find another therapist for this client. 🙏`
    );

    // Notify client
    await sendAndLog(
      lead as Lead,
      `Still looking for your perfect match — we'll have an update soon! 🙏`,
      'therapist_declined'
    );

    // Try next therapist
    await handleMoreOptions(lead as Lead, session as AgentSession);
    return;
  }

  // Therapist sent slot times (DD/MM pattern)
  const slotPattern = /(\d{1,2})\/(\d{1,2})\s+(?:at\s+)?(\d{1,2}):(\d{2})/gi;
  const slots: { date: string; time_ist: string; label: string }[] = [];
  const year = new Date().getFullYear();
  let match: RegExpExecArray | null;

  while ((match = slotPattern.exec(messageText)) !== null) {
    const [, day, month, hour, minute] = match;
    const d = day.padStart(2, '0');
    const m = month.padStart(2, '0');
    const h = hour.padStart(2, '0');

    slots.push({
      date: `${year}-${m}-${d}`,
      time_ist: `${h}:${minute} IST`,
      label: `${d}/${m} · ${h}:${minute} IST`,
    });
  }

  if (slots.length > 0) {
    // Update slot offer
    await supabaseAdmin
      .from('slot_offers')
      .update({
        offered_slots: slots,
        therapist_responded_at: new Date().toISOString(),
      })
      .eq('id', slotOffer.id);

    // Update appointment
    await supabaseAdmin
      .from('appointments')
      .update({ status: 'slots_offered', offered_slots: slots })
      .eq('id', slotOffer.appointment_id);

    // Send slots to client
    const slotLines = slots.map((s, i) => `${i + 1}️⃣ ${s.label}`).join('\n');
    const clientName = (lead as Lead).full_name?.split(' ')[0] ?? 'there';

    await sendAndLog(
      lead as Lead,
      `🗓️ ${therapist.full_name} has shared available slots:\n\n${slotLines}\n\nReply with *1*, *2*, or *3* to confirm your preferred slot.`,
      'slots_relayed'
    );

    // Confirm to therapist
    await sendTextMessage(
      therapist.whatsapp_number!,
      `✅ Slots shared with ${clientName}. We'll let you know once they pick a time!`
    );

    return;
  }

  // Unrecognized therapist message
  await sendTextMessage(
    therapist.whatsapp_number!,
    `Thanks for your message! If you'd like to share time slots, please use this format:\nDD/MM at HH:MM IST\n(e.g., 25/03 at 10:00 IST)`
  );
}

// ─────────────────────────────────────────────────────────────
// Slot selection → Payment
// ─────────────────────────────────────────────────────────────

async function handleSlotSelection(
  lead: Lead,
  session: AgentSession,
  slotNumber: number
): Promise<void> {
  const appointmentId = session.context_json?.appointment_id as string | undefined;
  if (!appointmentId) {
    await sendAndLog(lead, "I couldn't find your booking. Let me start fresh — what kind of support are you looking for?", 'error');
    await updateSession(session.id, { session_state: 'intake' });
    return;
  }

  // Get appointment with slot offer
  const { data: appointment } = await supabaseAdmin
    .from('appointments')
    .select('*, therapists(*)')
    .eq('id', appointmentId)
    .single();

  if (!appointment?.offered_slots || !Array.isArray(appointment.offered_slots)) {
    await sendAndLog(lead, "Hmm, I don't see any slots. Let me check with the therapist again.", 'error');
    return;
  }

  const slots = appointment.offered_slots as { date: string; time_ist: string; label: string }[];
  const selectedSlot = slots[slotNumber - 1];

  if (!selectedSlot) {
    await sendAndLog(lead, `Please reply with a number between 1 and ${slots.length}.`, 'invalid_slot');
    return;
  }

  // Update appointment
  await supabaseAdmin
    .from('appointments')
    .update({
      status: 'slot_selected',
      selected_slot: selectedSlot,
      session_date: selectedSlot.date,
    })
    .eq('id', appointmentId);

  // Update slot offer
  await supabaseAdmin
    .from('slot_offers')
    .update({
      client_selected_slot: selectedSlot,
      client_responded_at: new Date().toISOString(),
    })
    .eq('appointment_id', appointmentId);

  // Get therapist
  const therapistId = session.current_therapist_id!;
  const { data: therapist } = await supabaseAdmin
    .from('therapists')
    .select('*')
    .eq('id', therapistId)
    .single();

  if (!therapist) {
    await sendAndLog(lead, "Something went wrong. Our team will reach out shortly.", 'error');
    return;
  }

  const t = therapist as Therapist;
  const rateUsd = (t.session_rate_cents / 100).toFixed(0);

  // Generate Stripe payment link
  try {
    const paymentUrl = await createPaymentLink(
      lead,
      t,
      appointment as Appointment
    );

    // Send payment message to client
    await sendAndLog(
      lead,
      `✅ Perfect! Slot confirmed with *${t.full_name}* on *${selectedSlot.label}*.\n\n` +
      `To confirm your session, please complete the payment:\n\n` +
      `💳 ${paymentUrl}\n\n` +
      `💰 $${rateUsd} for 60-minute session\n` +
      `🔒 Secured by Stripe\n` +
      `✅ Full refund if unsatisfied\n\n` +
      `Your session will be confirmed once payment is received.`,
      'payment_link_sent'
    );

    // Notify therapist
    const clientFirstName = (lead.full_name ?? 'Client').split(' ')[0];
    await sendTextMessage(
      t.whatsapp_number!,
      `📋 Client ${clientFirstName} has selected *${selectedSlot.label}*.\n\n` +
      `⚠️ Please note: The session will only be confirmed after payment is received. We'll notify you once payment is done.\n\n` +
      `Please wait for payment confirmation before proceeding.`
    );

    await updateSession(session.id, {
      session_state: 'payment_sent',
      payment_link: paymentUrl,
      stripe_link_sent: true,
    });

    await supabaseAdmin
      .from('leads')
      .update({ status: 'payment_pending' })
      .eq('id', lead.id);

  } catch (err) {
    logger.error('Failed to create payment link', { error: (err as Error).message });
    await sendAndLog(
      lead,
      `I'm having trouble generating the payment link. Our team will send it to you shortly. 🙏`,
      'payment_error'
    );
    await escalateToHuman(lead, session, 'Payment link generation failed', 'Payment link creation error');
  }
}

// ─────────────────────────────────────────────────────────────
// STATE: payment_sent
// ─────────────────────────────────────────────────────────────

async function handlePaymentSent(
  lead: Lead,
  session: AgentSession,
  messageText: string
): Promise<void> {
  const lowerMsg = messageText.trim().toLowerCase();

  if (lowerMsg === 'support') {
    await escalateToHuman(lead, session, messageText, 'Client requested support during payment');
    return;
  }

  const therapistId = session.current_therapist_id;
  let therapistName = 'your therapist';
  if (therapistId) {
    const { data: t } = await supabaseAdmin
      .from('therapists')
      .select('full_name')
      .eq('id', therapistId)
      .single();
    if (t) therapistName = t.full_name;
  }

  const paymentLink = session.payment_link ?? '[payment link]';

  await sendAndLog(
    lead,
    `Your session with *${therapistName}* is pending payment.\n\n` +
    `Please complete payment here:\n💳 ${paymentLink}\n\n` +
    `Need help? Reply *SUPPORT* to speak with our team.`,
    'payment_reminder'
  );
}

// ─────────────────────────────────────────────────────────────
// STATE: confirmed
// ─────────────────────────────────────────────────────────────

async function handleConfirmed(
  lead: Lead,
  session: AgentSession,
  messageText: string
): Promise<void> {
  const aiReply = await generateAIResponse(
    lead,
    session,
    messageText,
    'The client\'s session is confirmed and paid. Help with session info, meeting link, or rescheduling requests. Be warm and supportive.'
  );
  await sendAndLog(lead, aiReply, 'confirmed');
}

// ─────────────────────────────────────────────────────────────
// STATE: escalated
// ─────────────────────────────────────────────────────────────

async function handleEscalated(
  lead: Lead,
  _session: AgentSession,
  messageText: string
): Promise<void> {
  // Forward to support — do NOT respond with AI
  const clientName = lead.full_name ?? lead.whatsapp_number ?? 'Unknown';

  await sendTextMessage(
    SUPPORT_WA_NUMBER,
    `⚠️ *[ESCALATED LEAD]*\n\n` +
    `👤 Client: ${clientName} (${lead.whatsapp_number})\n` +
    `💬 Their message: ${messageText}\n\n` +
    `Please respond to them directly.`
  );

  logger.info('Escalated message forwarded to support', {
    leadId: lead.id,
    fromNumber: lead.whatsapp_number,
  });
}

// ─────────────────────────────────────────────────────────────
// Escalation
// ─────────────────────────────────────────────────────────────

async function escalateToHuman(
  lead: Lead,
  session: AgentSession,
  messageText: string,
  reason: string
): Promise<void> {
  // Create escalation record
  await supabaseAdmin.from('manual_escalations').insert({
    lead_id: lead.id,
    reason,
    ai_last_message: messageText,
    status: 'pending',
    assigned_to: 'support',
  });

  // Update session
  await updateSession(session.id, {
    session_state: 'escalated',
    escalated_to_human: true,
    escalation_reason: reason,
  });

  // Forward to support
  const clientName = lead.full_name ?? 'Unknown';
  await sendTextMessage(
    SUPPORT_WA_NUMBER,
    `⚠️ *[ESCALATION]*\n\n` +
    `👤 Client: ${clientName} (${lead.whatsapp_number})\n` +
    `📋 Reason: ${reason}\n` +
    `💬 Last message: ${messageText}\n` +
    `📊 Session state: ${session.session_state}\n\n` +
    `Please respond to them.`
  );

  // Notify client
  await sendAndLog(
    lead,
    `I'm connecting you with our support team right now. Someone will respond shortly. 🙏\n\nFor urgent matters, WhatsApp us at: ${SUPPORT_WA_NUMBER}`,
    'escalation'
  );

  logger.info('Lead escalated to human', {
    leadId: lead.id,
    reason,
    previousState: session.session_state,
  });
}

// ─────────────────────────────────────────────────────────────
// Handle "more options" — find next therapist
// ─────────────────────────────────────────────────────────────

async function handleMoreOptions(
  lead: Lead,
  session: AgentSession
): Promise<void> {
  // Get the current therapist to exclude
  const excludeId = session.current_therapist_id;

  // Re-fetch lead for latest data
  const { data: refreshedLead } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('id', lead.id)
    .single();

  const matched = await matchTherapists(refreshedLead as Lead || lead);

  // Find a different therapist
  const nextTherapist = matched.find((t) => t.id !== excludeId);

  if (nextTherapist) {
    await updateSession(session.id, {
      session_state: 'matching',
      current_therapist_id: nextTherapist.id,
    });

    await handleMatching(
      refreshedLead as Lead || lead,
      { ...session, session_state: 'matching', current_therapist_id: nextTherapist.id },
      'Show me another therapist'
    );
  } else {
    await sendAndLog(
      lead,
      `I've shown you our best matches for your needs. Would you like to proceed with the previous therapist, or shall I connect you with our support team for personalized help?\n\nReply *YES* to go back or *SUPPORT* for help.`,
      'no_more_options'
    );
    await updateSession(session.id, { session_state: 'slot_request' });
  }
}

// ─────────────────────────────────────────────────────────────
// Extract therapist name from message
// ─────────────────────────────────────────────────────────────

async function extractTherapistFromMessage(
  messageText: string
): Promise<Therapist | null> {
  // Fetch all active therapists
  const { data: therapists } = await supabaseAdmin
    .from('therapists')
    .select('*')
    .eq('is_active', true);

  if (!therapists) return null;

  const lowerMsg = messageText.toLowerCase();

  for (const t of therapists as Therapist[]) {
    const fullName = t.full_name.toLowerCase();
    const firstName = fullName.split(' ')[0];
    const lastName = fullName.split(' ').slice(-1)[0];

    // Check full name, first name (min 4 chars to avoid false positives), or last name
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
// Extract intake info using Claude
// ─────────────────────────────────────────────────────────────

async function extractIntakeInfo(messageText: string): Promise<{
  therapy_type: string | null;
  concerns: string[];
  pain_summary: string | null;
  urgency: string | null;
}> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      system:
        'Extract therapy intake information from the user message. Return JSON with:\n' +
        '- "therapy_type": "individual" | "couples" | "family" | null\n' +
        '- "concerns": array of concern keywords (e.g. ["anxiety", "relationship issues"])\n' +
        '- "pain_summary": brief 1-2 sentence summary of what they shared\n' +
        '- "urgency": "immediate" | "this_week" | "exploring" | null\n' +
        'Return ONLY valid JSON.',
      messages: [{ role: 'user', content: messageText }],
    });

    const raw = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { therapy_type: null, concerns: [], pain_summary: null, urgency: null };

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    logger.error('extractIntakeInfo failed', { error: (err as Error).message });
    return { therapy_type: null, concerns: [], pain_summary: null, urgency: null };
  }
}
