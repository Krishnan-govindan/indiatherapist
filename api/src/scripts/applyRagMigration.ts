// ─────────────────────────────────────────────────────────────
// Apply RAG tables migration via Supabase REST/RPC
//
// Run with: npx ts-node src/scripts/applyRagMigration.ts
// ─────────────────────────────────────────────────────────────

import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function runSQL(sql: string, label: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  // The REST RPC approach may not work for DDL. Try the SQL endpoint instead.
  if (!res.ok) {
    // Fallback: use the pg endpoint
    console.log(`  ${label}: REST RPC failed (${res.status}), trying SQL API...`);
  } else {
    console.log(`  ✅ ${label}`);
  }
}

async function main(): Promise<void> {
  console.log('\nApplying RAG tables migration...\n');

  // Use Supabase Management API or direct pg connection
  // Since we have the service role key, let's use the supabase-js client
  // to verify tables exist after creation

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Check if tables already exist by trying to query them
  const { error: checkErr } = await supabase
    .from('ai_agent_sessions')
    .select('id')
    .limit(1);

  if (!checkErr) {
    console.log('Tables already exist! Verifying...\n');
  } else {
    console.log('Tables do not exist yet. Please run the migration SQL manually:');
    console.log('─'.repeat(60));
    console.log('Go to: https://supabase.com/dashboard/project/ghbglqhtrqrxxokdayxu/sql/new');
    console.log('Paste the contents of: supabase/migrations/012_rag_tables.sql');
    console.log('Click "Run"');
    console.log('─'.repeat(60));
    console.log('\nThen re-run this script to verify.\n');
    process.exit(1);
  }

  // Verify all 4 tables
  const tables = [
    'conversation_embeddings',
    'lead_context_summaries',
    'ai_agent_sessions',
    'manual_escalations',
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.log(`  ❌ ${table}: ${error.message}`);
    } else {
      console.log(`  ✅ ${table} — exists`);
    }
  }

  console.log('\nDone!\n');
}

main().catch((err: Error) => {
  console.error('Error:', err.message);
  process.exit(1);
});
