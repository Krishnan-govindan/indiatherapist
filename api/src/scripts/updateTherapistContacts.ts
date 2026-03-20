// ─────────────────────────────────────────────────────────────
// Update Therapist WhatsApp Numbers & Emails
//
// Run with: npx ts-node src/scripts/updateTherapistContacts.ts
//
// Updates whatsapp_number and email for 23 therapists.
// Does NOT modify any other fields.
// ─────────────────────────────────────────────────────────────

import 'dotenv/config';
import { supabaseAdmin } from '../lib/supabase';

interface TherapistContact {
  full_name: string;
  whatsapp_number: string;
  email?: string;
}

const CONTACTS: TherapistContact[] = [
  { full_name: 'Aekta Brahmbhatt', whatsapp_number: '+919167114754' },
  { full_name: 'Sharmee M Divan', whatsapp_number: '+919385960024' },
  { full_name: 'Dr. P T Sunderam', whatsapp_number: '+919640000054' },
  { full_name: 'Hemalatha Swaminathan', whatsapp_number: '+919381053134', email: 'network@4swithin.com' },
  { full_name: 'Niyatii N Shah', whatsapp_number: '+919820834868', email: 'projectaverti@gmail.com' },
  { full_name: 'Suvarna Varde', whatsapp_number: '+919819901581', email: 'milaapcounseling@gmail.com' },
  { full_name: 'Sudeeptha Grama', whatsapp_number: '+919886381571', email: 'sudeeptha@thecoffeeshopcounsellor.com' },
  { full_name: 'Anisha Rafi', whatsapp_number: '+917339336844' },
  { full_name: 'Snehal Chhajed', whatsapp_number: '+919561823601' },
  { full_name: 'Ashutosh Tiwari', whatsapp_number: '+916260474014' },
  { full_name: 'Sana Khullar', whatsapp_number: '+919971842641', email: 'info@sanakhullar.com' },
  { full_name: 'Preeti Somani', whatsapp_number: '+919899981217', email: 'therapistpreetisomani@gmail.com' },
  { full_name: 'Mahi Modi', whatsapp_number: '+919583013425' },
  { full_name: 'Gunjan Kaur Kukreja', whatsapp_number: '+918287416458', email: 'kaur.gunjan02@gmail.com' },
  { full_name: 'Amjad Ali Mohammad', whatsapp_number: '+919849494250' },
  { full_name: 'Lalitha Ragul', whatsapp_number: '+919003681043', email: 'lalitharagul88@gmail.com' },
  { full_name: 'Muthulakshmi Balasubramanian', whatsapp_number: '+919003283342', email: 'ml.vedha@gmail.com' },
  { full_name: 'Shruti Garg', whatsapp_number: '+917042989385', email: 'shruti.dramatherapy@gmail.com' },
  { full_name: 'Khushboo Sanghavi', whatsapp_number: '+917303915633', email: 'ksanghavi2910@gmail.com' },
  { full_name: 'Joshitha Cheppalli', whatsapp_number: '+917397224080', email: 'joshitha.cheppalli.98@gmail.com' },
  { full_name: 'Dimple Jain', whatsapp_number: '+918732903167', email: 'psychologistdimple@gmail.com' },
  { full_name: 'Janani K', whatsapp_number: '+917373740350' },
  { full_name: 'Rizun Sharma', whatsapp_number: '+918369612840', email: 'rizun.sharma@gmail.com' },
];

async function main(): Promise<void> {
  console.log(`\nUpdating WhatsApp numbers & emails for ${CONTACTS.length} therapists...\n`);
  console.log('─'.repeat(70));

  let updated = 0;
  let notFound = 0;
  let errors = 0;

  for (const contact of CONTACTS) {
    const updateData: Record<string, string> = {
      whatsapp_number: contact.whatsapp_number,
      updated_at: new Date().toISOString(),
    };
    if (contact.email) {
      updateData.email = contact.email;
    }

    const { data, error } = await supabaseAdmin
      .from('therapists')
      .update(updateData)
      .ilike('full_name', contact.full_name)
      .select('full_name, whatsapp_number, email');

    if (error) {
      console.log(`  ❌  ${contact.full_name.padEnd(35)} Error: ${error.message}`);
      errors++;
    } else if (!data || data.length === 0) {
      console.log(`  ⚠️   ${contact.full_name.padEnd(35)} NOT FOUND in database`);
      notFound++;
    } else {
      const t = data[0];
      console.log(`  ✅  ${t.full_name.padEnd(35)} ${t.whatsapp_number}  ${t.email ?? ''}`);
      updated++;
    }
  }

  console.log('─'.repeat(70));
  console.log(`\nSummary: ${updated} updated, ${notFound} not found, ${errors} errors\n`);

  // Verify: list all therapists with their contact info
  console.log('─'.repeat(70));
  console.log('VERIFICATION — All therapists:\n');

  const { data: all, error: listErr } = await supabaseAdmin
    .from('therapists')
    .select('full_name, whatsapp_number, email')
    .order('full_name');

  if (listErr) {
    console.error('Failed to query therapists:', listErr.message);
    process.exit(1);
  }

  for (const t of all ?? []) {
    console.log(`  ${(t.full_name ?? '').padEnd(35)} ${(t.whatsapp_number ?? '—').padEnd(18)} ${t.email ?? '—'}`);
  }

  console.log(`\nTotal therapists: ${all?.length ?? 0}`);

  if (notFound > 0 || errors > 0) {
    process.exit(1);
  }
}

main().catch((err: Error) => {
  console.error('\nUnexpected error:', err.message);
  process.exit(1);
});
