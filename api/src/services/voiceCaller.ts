import axios from 'axios';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';
import type { Lead } from '../lib/types';

const VAPI_BASE = 'https://api.vapi.ai';

function vapiHeaders(): Record<string, string> {
  const key = process.env.VAPI_API_KEY;
  if (!key) throw new Error('Missing env: VAPI_API_KEY');
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

// ─────────────────────────────────────────────────────────────
// 1. Trigger outbound call via Vapi
//    Returns the Vapi call ID
// ─────────────────────────────────────────────────────────────

export async function triggerOutboundCall(lead: Lead): Promise<string> {
  const agentId = process.env.VAPI_AGENT_ID;
  if (!agentId) throw new Error('Missing env: VAPI_AGENT_ID');

  if (!lead.phone) {
    throw new Error(`Lead ${lead.id} has no phone number — cannot trigger call`);
  }

  const payload = {
    assistantId: agentId,
    customer: {
      number: lead.phone, // must be E.164, e.g. "+919876543210"
      name: lead.full_name ?? undefined,
    },
    assistantOverrides: {
      variableValues: {
        leadName: lead.full_name ?? 'there',
        therapyType: lead.therapy_type ?? 'individual',
        language: lead.preferred_languages?.[0] ?? 'English',
      },
    },
  };

  let callId: string;

  try {
    const { data } = await axios.post(`${VAPI_BASE}/call`, payload, {
      headers: vapiHeaders(),
    });
    callId = data.id as string;
    logger.info('Vapi outbound call triggered', { callId, leadId: lead.id, phone: lead.phone });
  } catch (err) {
    logger.error('triggerOutboundCall failed', {
      leadId: lead.id,
      error: (err as Error).message,
    });
    throw err;
  }

  // Persist call ID and advance lead status
  const { error: dbError } = await supabaseAdmin
    .from('leads')
    .update({
      voice_call_id: callId,
      status: 'voice_called',
    })
    .eq('id', lead.id);

  if (dbError) {
    // Non-fatal — call is already in flight; log and continue
    logger.error('Failed to update lead after call trigger', {
      leadId: lead.id,
      callId,
      error: dbError.message,
    });
  }

  return callId;
}

// ─────────────────────────────────────────────────────────────
// 2. Fetch call summary / transcript from Vapi
// ─────────────────────────────────────────────────────────────

export async function getCallSummary(callId: string): Promise<string> {
  try {
    const { data } = await axios.get(`${VAPI_BASE}/call/${callId}`, {
      headers: vapiHeaders(),
    });

    // Prefer the structured summary; fall back to full transcript
    const summary: string =
      data.summary ??
      data.transcript ??
      'No summary available';

    logger.info('Vapi call summary fetched', { callId, length: summary.length });
    return summary;
  } catch (err) {
    logger.error('getCallSummary failed', { callId, error: (err as Error).message });
    throw err;
  }
}
