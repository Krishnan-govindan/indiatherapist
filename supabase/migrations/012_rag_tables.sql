-- Migration: 012_rag_tables.sql
-- RAG architecture tables for AI agent context memory.
-- Does NOT modify any existing tables.

-- ─────────────────────────────────────────────────────────────
-- Table 1: conversation_embeddings
-- Stores message content with optional embeddings for similarity search.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE conversation_embeddings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id      UUID REFERENCES leads(id) ON DELETE CASCADE,
  message_id   UUID REFERENCES conversations(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  role         TEXT NOT NULL,           -- 'user' | 'assistant' | 'system'
  token_count  INTEGER,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conv_embed_lead_id ON conversation_embeddings(lead_id);
CREATE INDEX idx_conv_embed_created ON conversation_embeddings(lead_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- Table 2: lead_context_summaries
-- AI-generated running summary per lead for RAG context.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE lead_context_summaries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          UUID UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
  summary          TEXT,
  key_concerns     TEXT[] DEFAULT '{}',
  session_count    INTEGER DEFAULT 0,
  last_therapist   TEXT,
  last_updated     TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Table 3: ai_agent_sessions
-- Tracks the AI agent's conversation state with each lead.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE ai_agent_sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id               UUID REFERENCES leads(id) ON DELETE CASCADE,
  session_state         TEXT DEFAULT 'greeting',
    -- States: greeting | intake | matching | slot_request
    --         slot_relay | payment_sent | confirmed | escalated
  current_therapist_id  UUID REFERENCES therapists(id),
  slot_offer_sent       BOOLEAN DEFAULT FALSE,
  payment_link          TEXT,
  stripe_link_sent      BOOLEAN DEFAULT FALSE,
  therapist_confirmed   BOOLEAN DEFAULT FALSE,
  client_confirmed      BOOLEAN DEFAULT FALSE,
  escalated_to_human    BOOLEAN DEFAULT FALSE,
  escalation_reason     TEXT,
  context_json          JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_session_lead ON ai_agent_sessions(lead_id);

CREATE TRIGGER ai_agent_sessions_updated_at
  BEFORE UPDATE ON ai_agent_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Table 4: manual_escalations
-- When the AI agent can't handle a conversation, escalate to human.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE manual_escalations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID REFERENCES leads(id),
  reason          TEXT NOT NULL,
  ai_last_message TEXT,
  status          TEXT DEFAULT 'pending',  -- pending | resolved
  assigned_to     TEXT DEFAULT 'support',
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_escalation_status ON manual_escalations(status);
CREATE INDEX idx_escalation_lead ON manual_escalations(lead_id);
