import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';
import type { Lead, Therapist } from '../lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─────────────────────────────────────────────────────────────
// matchTherapists
// Returns top 2-3 therapists ranked by fit for the given lead.
// Side effect: updates lead.matched_therapist_id + status = 'matched'
// ─────────────────────────────────────────────────────────────

export async function matchTherapists(lead: Lead): Promise<Therapist[]> {
  // ── 1. Fetch all active therapists ──────────────────────────
  const { data: therapists, error } = await supabaseAdmin
    .from('therapists')
    .select('*')
    .eq('is_active', true);

  if (error || !therapists || therapists.length === 0) {
    logger.error('matchTherapists: failed to fetch therapists', { error: error?.message });
    return [];
  }

  logger.info('matchTherapists: running Claude matching', {
    leadId: lead.id,
    therapistCount: therapists.length,
  });

  // ── 2. Build Claude prompt ───────────────────────────────────
  const clientProfile = {
    languages: lead.preferred_languages,
    concern: lead.pain_summary ?? lead.presenting_issues,
    therapy_type: lead.therapy_type,
    urgency: lead.urgency,
  };

  const therapistProfiles = therapists.map((t: Therapist) => ({
    id: t.id,
    languages: t.languages,
    specialties: t.specialties,
    therapy_types: t.therapy_types,
    experience_years: t.experience_years,
    tier: t.tier,
  }));

  const userPrompt =
    `Client: ${JSON.stringify(clientProfile)}\n\n` +
    `Therapists: ${JSON.stringify(therapistProfiles)}\n\n` +
    `Return ONLY a JSON array of therapist IDs in ranked order, e.g.: ["uuid1", "uuid2"]`;

  // ── 3. Call Claude ───────────────────────────────────────────
  let rankedIds: string[] = [];

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      system:
        'You are a therapy matching engine. Given a client profile and a list of therapists, ' +
        'return the top 2-3 best matches as a JSON array of therapist IDs, ranked by fit. ' +
        'Consider: language match (highest weight), specialty match with presenting concern, ' +
        'experience years, tier preference if mentioned.',
      messages: [{ role: 'user', content: userPrompt }],
    });

    const raw = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    // Extract JSON array from response — handle any surrounding prose
    const jsonMatch = raw.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) throw new Error(`Unexpected Claude response format: ${raw.slice(0, 120)}`);

    rankedIds = JSON.parse(jsonMatch[0]) as string[];
    logger.info('matchTherapists: Claude returned ranked IDs', { rankedIds });
  } catch (err) {
    logger.error('matchTherapists: Claude call failed', { error: (err as Error).message });
    // Fallback: return first 2 active therapists to avoid blocking the pipeline
    rankedIds = (therapists as Therapist[]).slice(0, 2).map((t) => t.id);
    logger.warn('matchTherapists: using fallback order', { rankedIds });
  }

  // ── 4. Resolve full therapist objects in ranked order ────────
  const therapistMap = new Map<string, Therapist>(
    (therapists as Therapist[]).map((t) => [t.id, t])
  );

  const matched = rankedIds
    .map((id) => therapistMap.get(id))
    .filter((t): t is Therapist => t !== undefined);

  if (matched.length === 0) {
    logger.warn('matchTherapists: no valid therapists after ID resolution', { rankedIds });
    return [];
  }

  // ── 5. Update lead with top match ────────────────────────────
  const topMatch = matched[0];

  const { error: updateError } = await supabaseAdmin
    .from('leads')
    .update({
      matched_therapist_id: topMatch.id,
      status: 'matched',
    })
    .eq('id', lead.id);

  if (updateError) {
    logger.error('matchTherapists: failed to update lead', { error: updateError.message });
  } else {
    logger.info('matchTherapists: lead updated', {
      leadId: lead.id,
      matchedTherapistId: topMatch.id,
      status: 'matched',
    });
  }

  return matched;
}

// ─────────────────────────────────────────────────────────────
// formatTherapistMatchMessage
// Returns a WhatsApp-ready message presenting matched therapists
// ─────────────────────────────────────────────────────────────

export function formatTherapistMatchMessage(therapists: Therapist[], lead: Lead): string {
  if (therapists.length === 0) {
    return (
      `Hi ${lead.full_name ?? 'there'} 🙏\n\n` +
      "We're finding the perfect therapist for you. " +
      "Our team will be in touch shortly with options tailored to your needs."
    );
  }

  const lines: string[] = [
    `Based on what you've shared, here are therapists who can help 🙏\n`,
  ];

  therapists.forEach((t, index) => {
    const rateUsd = (t.session_rate_cents / 100).toFixed(0);
    const topSpecialty = t.specialties[0] ?? 'mental wellness';
    const languages = t.languages.join(', ');
    const exp = t.experience_years ? `${t.experience_years} yrs experience` : 'Experienced';

    lines.push(
      `⭐ *${index + 1}. ${t.full_name}* — ${exp}`,
      `Specializes in ${topSpecialty}`,
      `Languages: ${languages}`,
      `$${rateUsd}/session`,
      ``
    );
  });

  lines.push(
    `Reply with *1*${therapists.length > 1 ? ` or *2*` : ''} to choose your therapist,`,
    `or reply *more* to see other options.`
  );

  return lines.join('\n');
}
