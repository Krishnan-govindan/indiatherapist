// ─────────────────────────────────────────────────────────────
// WhatsApp Template Submission Script
//
// Run with: npx ts-node src/scripts/submitTemplates.ts
//
// Prerequisites:
//   1. Set META_WA_ACCESS_TOKEN in your .env (permanent system user token
//      from Meta Business Manager → System Users)
//   2. Set META_WA_BUSINESS_ACCOUNT_ID in your .env (WhatsApp Business
//      Account ID — find it in Meta Business Manager → WhatsApp Accounts)
//
// Templates take 24-48 hours for Meta approval.
// Check status at: https://business.facebook.com/wa/manage/message-templates/
//
// Once approved, use sendTemplateMessage() from services/whatsapp.ts
// to send them. Templates can only be sent outside the 24-hour
// customer service window (i.e. to users who haven't messaged you recently).
// ─────────────────────────────────────────────────────────────

import 'dotenv/config';
import { TEMPLATES, type TemplateDefinition } from '../services/waTemplates';

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────

const ACCESS_TOKEN = process.env.META_WA_ACCESS_TOKEN;
const WABA_ID      = process.env.META_WA_BUSINESS_ACCOUNT_ID;
const API_VERSION  = 'v19.0';
const BASE_URL     = `https://graph.facebook.com/${API_VERSION}`;

// ─────────────────────────────────────────────────────────────
// Submit a single template
// ─────────────────────────────────────────────────────────────

interface SubmitResult {
  name: string;
  status: 'submitted' | 'already_exists' | 'error';
  id?: string;
  message?: string;
}

async function submitTemplate(tpl: TemplateDefinition): Promise<SubmitResult> {
  const url = `${BASE_URL}/${WABA_ID}/message_templates`;

  const payload = {
    name:       tpl.name,
    language:   tpl.language,
    category:   tpl.category,
    components: tpl.components,
  };

  const res = await fetch(url, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json() as {
    id?: string;
    status?: string;
    error?: { message: string; code: number; error_subcode?: number };
  };

  if (!res.ok) {
    // Code 100 subcode 2388085 = template already exists
    if (body.error?.code === 100 && body.error?.error_subcode === 2388085) {
      return { name: tpl.name, status: 'already_exists', message: 'Template already exists on Meta — no action needed' };
    }
    return { name: tpl.name, status: 'error', message: body.error?.message ?? `HTTP ${res.status}` };
  }

  return { name: tpl.name, status: 'submitted', id: body.id };
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Guard: check required env vars
  if (!ACCESS_TOKEN) {
    console.error('❌  META_WA_ACCESS_TOKEN is not set in .env');
    process.exit(1);
  }
  if (!WABA_ID) {
    console.error('❌  META_WA_BUSINESS_ACCOUNT_ID is not set in .env');
    process.exit(1);
  }

  const templateList = Object.values(TEMPLATES);
  console.log(`\n🚀  Submitting ${templateList.length} WhatsApp templates to Meta...\n`);
  console.log(`   WABA ID : ${WABA_ID}`);
  console.log(`   API     : ${BASE_URL}\n`);
  console.log('─'.repeat(60));

  let submitted = 0;
  let skipped   = 0;
  let failed    = 0;

  for (const tpl of templateList) {
    process.stdout.write(`  ${tpl.name.padEnd(35)} `);

    const result = await submitTemplate(tpl);

    switch (result.status) {
      case 'submitted':
        console.log(`✅  Submitted  (id: ${result.id})`);
        submitted++;
        break;
      case 'already_exists':
        console.log(`⏭️   Already exists — skipped`);
        skipped++;
        break;
      case 'error':
        console.log(`❌  Error: ${result.message}`);
        failed++;
        break;
    }

    // Small delay to avoid rate limits
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log('─'.repeat(60));
  console.log(`\n📊  Summary:`);
  console.log(`   Submitted    : ${submitted}`);
  console.log(`   Already exist: ${skipped}`);
  console.log(`   Failed       : ${failed}`);

  if (submitted > 0) {
    console.log(`\n⏳  Templates submitted for review.`);
    console.log(`   Approval usually takes 24-48 hours.`);
    console.log(`   Track status at: https://business.facebook.com/wa/manage/message-templates/\n`);
  }

  if (failed > 0) {
    console.log(`\n⚠️   Some templates failed. Common causes:`);
    console.log(`   • Template body contains prohibited content`);
    console.log(`   • Variable placeholders not in {{n}} format`);
    console.log(`   • MARKETING templates require opt-in language\n`);
    process.exit(1);
  }
}

main().catch((err: Error) => {
  console.error('\n💥  Unexpected error:', err.message);
  process.exit(1);
});
