// ─────────────────────────────────────────────────────────────
// Embedding / RAG Service
//
// Uses our existing Anthropic Claude SDK for summarization
// and text-based retrieval for conversation context.
// No OpenAI dependency — stays on our Anthropic stack.
// ─────────────────────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─────────────────────────────────────────────────────────────
// storeMessageEmbedding
// Stores a message in conversation_embeddings for RAG retrieval.
// ─────────────────────────────────────────────────────────────

export async function storeMessageEmbedding(
  leadId: string,
  messageId: string,
  content: string,
  role: string
): Promise<void> {
  const tokenCount = Math.ceil(content.length / 4); // rough estimate

  const { error } = await supabaseAdmin
    .from('conversation_embeddings')
    .insert({
      lead_id: leadId,
      message_id: messageId,
      content,
      role,
      token_count: tokenCount,
    });

  if (error) {
    logger.error('storeMessageEmbedding: insert failed', { error: error.message, leadId });
  }
}

// ─────────────────────────────────────────────────────────────
// getRelevantHistory
// Retrieves recent conversation history for a lead, ordered
// by recency. Uses text-based retrieval (last N messages).
// ─────────────────────────────────────────────────────────────

export async function getRelevantHistory(
  leadId: string,
  _currentMessage: string,
  limit: number = 10
): Promise<{ content: string; role: string; created_at: string }[]> {
  // Fetch from conversation_embeddings (our indexed store)
  const { data, error } = await supabaseAdmin
    .from('conversation_embeddings')
    .select('content, role, created_at')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('getRelevantHistory: query failed', { error: error.message, leadId });
    return [];
  }

  // Return in chronological order (oldest first)
  return (data ?? []).reverse();
}

// ─────────────────────────────────────────────────────────────
// getLeadContextSummary
// Returns the existing context summary for a lead, if any.
// ─────────────────────────────────────────────────────────────

export async function getLeadContextSummary(
  leadId: string
): Promise<{
  summary: string | null;
  key_concerns: string[];
  session_count: number;
  last_therapist: string | null;
} | null> {
  const { data, error } = await supabaseAdmin
    .from('lead_context_summaries')
    .select('summary, key_concerns, session_count, last_therapist')
    .eq('lead_id', leadId)
    .single();

  if (error || !data) return null;
  return data;
}

// ─────────────────────────────────────────────────────────────
// updateLeadContextSummary
// Fetches last 20 messages for a lead and generates an
// AI summary using Claude Haiku. Upserts into lead_context_summaries.
// ─────────────────────────────────────────────────────────────

export async function updateLeadContextSummary(leadId: string): Promise<void> {
  // Fetch last 20 messages from conversations table
  const { data: messages, error: msgErr } = await supabaseAdmin
    .from('conversations')
    .select('message_body, direction, created_at')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (msgErr || !messages || messages.length === 0) {
    logger.warn('updateLeadContextSummary: no messages found', { leadId });
    return;
  }

  // Build conversation transcript (oldest first)
  const transcript = messages
    .reverse()
    .map((m) => {
      const role = m.direction === 'inbound' ? 'Client' : 'Agent';
      return `${role}: ${m.message_body ?? '[no text]'}`;
    })
    .join('\n');

  // Fetch lead info for extra context
  const { data: lead } = await supabaseAdmin
    .from('leads')
    .select('full_name, therapy_type, presenting_issues, matched_therapist_id')
    .eq('id', leadId)
    .single();

  // Get therapist name if matched
  let lastTherapist: string | null = null;
  if (lead?.matched_therapist_id) {
    const { data: therapist } = await supabaseAdmin
      .from('therapists')
      .select('full_name')
      .eq('id', lead.matched_therapist_id)
      .single();
    lastTherapist = therapist?.full_name ?? null;
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 400,
      system:
        'You are a clinical note summarizer. Given a therapy lead conversation, ' +
        'produce a JSON response with exactly these fields:\n' +
        '- "summary": 3-4 sentence clinical summary of the lead\'s situation\n' +
        '- "key_concerns": array of 2-5 short concern labels (e.g. "anxiety", "relationship conflict")\n' +
        '- "session_count": number of distinct conversation sessions you can identify\n' +
        'Return ONLY valid JSON, no markdown.',
      messages: [{ role: 'user', content: transcript }],
    });

    const raw = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.error('updateLeadContextSummary: could not parse Claude response', { raw: raw.slice(0, 200) });
      return;
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      summary: string;
      key_concerns: string[];
      session_count: number;
    };

    // Upsert into lead_context_summaries
    const { error: upsertErr } = await supabaseAdmin
      .from('lead_context_summaries')
      .upsert(
        {
          lead_id: leadId,
          summary: parsed.summary,
          key_concerns: parsed.key_concerns,
          session_count: parsed.session_count,
          last_therapist: lastTherapist,
          last_updated: new Date().toISOString(),
        },
        { onConflict: 'lead_id' }
      );

    if (upsertErr) {
      logger.error('updateLeadContextSummary: upsert failed', { error: upsertErr.message });
    } else {
      logger.info('updateLeadContextSummary: summary updated', {
        leadId,
        concerns: parsed.key_concerns,
        sessions: parsed.session_count,
      });
    }
  } catch (err) {
    logger.error('updateLeadContextSummary: Claude call failed', { error: (err as Error).message });
  }
}

// ─────────────────────────────────────────────────────────────
// buildRAGContext
// Main entry point: builds full context for the AI agent by
// combining lead summary + recent conversation history.
// ─────────────────────────────────────────────────────────────

export async function buildRAGContext(
  leadId: string,
  currentMessage: string
): Promise<string> {
  const [summary, history] = await Promise.all([
    getLeadContextSummary(leadId),
    getRelevantHistory(leadId, currentMessage, 10),
  ]);

  const parts: string[] = [];

  if (summary) {
    parts.push('=== LEAD CONTEXT SUMMARY ===');
    parts.push(summary.summary ?? 'No summary available.');
    if (summary.key_concerns.length > 0) {
      parts.push(`Key concerns: ${summary.key_concerns.join(', ')}`);
    }
    if (summary.last_therapist) {
      parts.push(`Last matched therapist: ${summary.last_therapist}`);
    }
    parts.push(`Sessions: ${summary.session_count}`);
    parts.push('');
  }

  if (history.length > 0) {
    parts.push('=== RECENT CONVERSATION ===');
    for (const msg of history) {
      const label = msg.role === 'user' ? 'Client' : 'Agent';
      parts.push(`${label}: ${msg.content}`);
    }
    parts.push('');
  }

  parts.push('=== CURRENT MESSAGE ===');
  parts.push(`Client: ${currentMessage}`);

  return parts.join('\n');
}
