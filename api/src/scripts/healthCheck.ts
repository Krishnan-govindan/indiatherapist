// ─────────────────────────────────────────────────────────────
// Health Check Script
//
// Tests all integrations and prints a PASS/FAIL table.
// Run with: npx ts-node src/scripts/healthCheck.ts
// ─────────────────────────────────────────────────────────────

import 'dotenv/config';
import axios from 'axios';
import { supabaseAdmin } from '../lib/supabase';

interface CheckResult {
  name: string;
  status: 'PASS' | 'FAIL';
  detail: string;
}

const results: CheckResult[] = [];

function pass(name: string, detail: string): void {
  results.push({ name, status: 'PASS', detail });
}

function fail(name: string, detail: string): void {
  results.push({ name, status: 'FAIL', detail });
}

// ─────────────────────────────────────────────────────────────
// Checks
// ─────────────────────────────────────────────────────────────

async function checkSupabase(): Promise<void> {
  try {
    const { data, error } = await supabaseAdmin.from('therapists').select('id').limit(1);
    if (error) throw new Error(error.message);
    pass('Supabase Connection', 'Connected successfully');
  } catch (err) {
    fail('Supabase Connection', (err as Error).message);
  }
}

async function checkTherapists(): Promise<void> {
  try {
    const { count, error } = await supabaseAdmin
      .from('therapists')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);
    if (error) throw new Error(error.message);
    pass('Active Therapists', `${count ?? 0} active therapists`);
  } catch (err) {
    fail('Active Therapists', (err as Error).message);
  }
}

async function checkRAGTables(): Promise<void> {
  const tables = ['conversation_embeddings', 'lead_context_summaries', 'ai_agent_sessions', 'manual_escalations'];
  let allOk = true;
  const missing: string[] = [];

  for (const table of tables) {
    const { error } = await supabaseAdmin.from(table).select('id').limit(1);
    if (error) {
      allOk = false;
      missing.push(table);
    }
  }

  if (allOk) {
    pass('RAG Tables', `All 4 tables exist`);
  } else {
    fail('RAG Tables', `Missing: ${missing.join(', ')}`);
  }
}

async function checkConversations(): Promise<void> {
  try {
    const { count, error } = await supabaseAdmin
      .from('conversations')
      .select('id', { count: 'exact', head: true });
    if (error) throw new Error(error.message);
    pass('Conversations Table', `${count ?? 0} messages`);
  } catch (err) {
    fail('Conversations Table', (err as Error).message);
  }
}

async function checkAnthropicAPI(): Promise<void> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    fail('Anthropic API', 'ANTHROPIC_API_KEY not set');
    return;
  }

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: key });
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say "ok"' }],
    });
    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');
    pass('Anthropic API', `Claude Haiku responded: "${text.trim()}"`);
  } catch (err) {
    fail('Anthropic API', (err as Error).message);
  }
}

async function checkMetaWA(): Promise<void> {
  const token = process.env.META_WA_ACCESS_TOKEN;
  const phoneId = process.env.META_WA_PHONE_NUMBER_ID;

  if (!token) {
    fail('Meta WhatsApp API', 'META_WA_ACCESS_TOKEN not set');
    return;
  }
  if (!phoneId) {
    fail('Meta WhatsApp API', 'META_WA_PHONE_NUMBER_ID not set');
    return;
  }

  try {
    const res = await axios.get(`https://graph.facebook.com/v19.0/${phoneId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const name = res.data?.verified_name ?? res.data?.display_phone_number ?? 'OK';
    pass('Meta WhatsApp API', `Verified: ${name}`);
  } catch (err) {
    fail('Meta WhatsApp API', (err as Error).message);
  }
}

async function checkStripe(): Promise<void> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    fail('Stripe', 'STRIPE_SECRET_KEY not set');
    return;
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(key, { apiVersion: '2026-02-25.clover' });
    const balance = await stripe.balance.retrieve();
    pass('Stripe', `Connected (${balance.available.length} currency balances)`);
  } catch (err) {
    fail('Stripe', (err as Error).message);
  }
}

async function checkVapi(): Promise<void> {
  const key = process.env.VAPI_API_KEY;
  if (!key) {
    fail('Vapi', 'VAPI_API_KEY not set');
    return;
  }

  try {
    const res = await axios.get('https://api.vapi.ai/assistant', {
      headers: { Authorization: `Bearer ${key}` },
    });
    const count = Array.isArray(res.data) ? res.data.length : 0;
    pass('Vapi', `Connected (${count} assistants)`);
  } catch (err) {
    fail('Vapi', (err as Error).message);
  }
}

async function checkEnvVars(): Promise<void> {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'META_WA_PHONE_NUMBER_ID',
    'META_WA_ACCESS_TOKEN',
    'ANTHROPIC_API_KEY',
    'STRIPE_SECRET_KEY',
    'ADMIN_SECRET',
  ];

  const optional = [
    'AI_WA_NUMBER',
    'SUPPORT_WA_NUMBER',
    'META_WA_BUSINESS_ACCOUNT_ID',
    'META_WA_VERIFY_TOKEN',
    'STRIPE_WEBHOOK_SECRET',
    'VAPI_API_KEY',
    'VAPI_AGENT_ID',
    'RESEND_API_KEY',
    'NEXT_PUBLIC_APP_URL',
  ];

  const missing = required.filter((k) => !process.env[k]);
  const unsetOptional = optional.filter((k) => !process.env[k]);

  if (missing.length === 0) {
    pass('Env Vars (required)', `All ${required.length} required vars set`);
  } else {
    fail('Env Vars (required)', `Missing: ${missing.join(', ')}`);
  }

  if (unsetOptional.length === 0) {
    pass('Env Vars (optional)', `All ${optional.length} optional vars set`);
  } else {
    pass('Env Vars (optional)', `${optional.length - unsetOptional.length}/${optional.length} set (missing: ${unsetOptional.join(', ')})`);
  }
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n🏥  India Therapist — Health Check\n');
  console.log('─'.repeat(65));

  await checkEnvVars();
  await checkSupabase();
  await checkTherapists();
  await checkRAGTables();
  await checkConversations();
  await checkAnthropicAPI();
  await checkMetaWA();
  await checkStripe();
  await checkVapi();

  console.log('');

  // Print results table
  const nameWidth = 25;
  const statusWidth = 6;
  const detailWidth = 30;

  console.log(
    `${'CHECK'.padEnd(nameWidth)} ${'STATUS'.padEnd(statusWidth)} DETAIL`
  );
  console.log('─'.repeat(65));

  let passCount = 0;
  let failCount = 0;

  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(
      `${r.name.padEnd(nameWidth)} ${icon} ${r.status.padEnd(4)}  ${r.detail.slice(0, 40)}`
    );
    if (r.status === 'PASS') passCount++;
    else failCount++;
  }

  console.log('─'.repeat(65));
  console.log(`\n📊  ${passCount} passed, ${failCount} failed out of ${results.length} checks\n`);

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((err: Error) => {
  console.error('\nUnexpected error:', err.message);
  process.exit(1);
});
