import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/SEO/JsonLd";
import { getFaqSchema } from "@/lib/schemas";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.indiatherapist.com";

export const metadata: Metadata = {
  title: "NRI Mental Health: The Complete Guide for Indians Living Abroad",
  description:
    "The definitive guide to mental health challenges faced by NRIs — loneliness, visa anxiety, cultural identity, and family pressure. Written by India Therapist's clinical team.",
  alternates: { canonical: `${APP_URL}/nri-mental-health` },
  openGraph: {
    title: "NRI Mental Health: The Complete Guide for Indians Living Abroad",
    description:
      "The definitive guide to mental health challenges faced by NRIs — loneliness, visa anxiety, cultural identity, and family pressure.",
    url: `${APP_URL}/nri-mental-health`,
    type: "article",
    images: [{ url: `${APP_URL}/logo.png`, width: 1200, height: 630, alt: "India Therapist" }],
  },
};

// ─────────────────────────────────────────────────────────────
// Content data
// ─────────────────────────────────────────────────────────────

const challenges = [
  {
    title: "1. Loneliness and cultural isolation abroad",
    body: "NRI loneliness is distinct from ordinary loneliness. It combines physical distance from family, cultural isolation in a foreign environment, and the paradox of appearing successful while feeling emotionally rootless. Weekends without family, festivals celebrated alone, and the absence of a shared cultural frame with colleagues all contribute to a deep, chronic loneliness that many NRIs carry silently for years.",
  },
  {
    title: "2. Visa and immigration anxiety (H-1B, PR, partner visa)",
    body: "Approximately 580,000 Indian professionals in the United States hold H-1B visas — with many more on PR pathways in Australia, Canada, and the UK. The dependency between their visa status and employment creates a uniquely compounded form of anxiety: any job insecurity becomes an existential threat. Hypervigilance about job security, inability to take career risks, sleep disruption, and anticipatory grief about potential deportation are hallmarks of immigration-linked anxiety.",
  },
  {
    title: "3. Bicultural identity — \"too Indian, too Western\"",
    body: "Many NRIs describe feeling caught between two identities: too Westernised for family back in India, yet too Indian to be fully accepted in their adopted country. This identity ambiguity is a distinct psychological stressor — without a secure cultural home, many NRIs experience persistent feelings of inadequacy, imposter syndrome, and difficulty forming authentic relationships in either context.",
  },
  {
    title: "4. Family pressure from India across time zones",
    body: "The joint family system means that being abroad doesn't mean being out of the family dynamic. WhatsApp calls, guilt-laden conversations, marriage pressure, eldercare anxiety, and financial obligations to family in India don't stop at the border. Many NRIs experience the full weight of Indian family expectations while simultaneously managing the pressures of their professional and personal life abroad.",
  },
  {
    title: "5. Imposter syndrome in foreign workplaces",
    body: "First-generation Indian immigrants in competitive Western workplaces often experience a particular form of imposter syndrome — the fear that their accent, their cultural background, or their communication style makes them fundamentally less suited to succeed. This is compounded when workplace cultures subtly penalise difference, creating a chronic sense of needing to prove oneself more than peers.",
  },
  {
    title: "6. Grief of missing milestones (weddings, deaths, festivals)",
    body: "Not being present for a sibling's wedding, a parent's illness, a grandparent's death, or Diwali with the family creates a specific kind of grief — disenfranchised grief, in clinical terms — that is rarely acknowledged or supported. The guilt of choosing a career or a visa over being present for the moments that matter is one of the most consistently reported emotional burdens among NRI clients.",
  },
];

const whyWesternFails = [
  {
    point: "They don't understand joint family systems",
    detail:
      "Western therapy often assumes nuclear family structures as the default. The concept of a joint family — with its obligations, hierarchies, and emotional interdependencies — is frequently misread as enmeshment or codependency.",
  },
  {
    point: '"Set boundaries" doesn\'t work in Indian cultural context',
    detail:
      "The standard Western therapeutic response to family stress is to \"set boundaries.\" For NRI clients, this advice ignores the cultural reality of filial piety, family honour (izzat), and the very real consequences of defying family expectations in Indian communities.",
  },
  {
    point: "They pathologise Indian family closeness",
    detail:
      "Deep emotional dependence on parents, regular family calls, and deference to elders are often flagged as psychological problems by Western therapists, when they are culturally normative and often healthy expressions of Indian family values.",
  },
  {
    point: "Language barrier even in English sessions",
    detail:
      "Even when sessions are conducted in English, cultural concepts like sharam (shame), izzat (honour), jugaad, parivar, and the emotional vocabulary of Indian languages don't have clean English equivalents. The nuance is lost.",
  },
];

const whatToLookFor = [
  "Speaks at least one Indian language — so you can express yourself in the language you feel emotions in",
  "Understands Indian family dynamics, joint family systems, and cultural norms without being briefed",
  "Has experience with immigration and expat clients — specifically NRI presentations",
  "Is available across your time zone — India-based therapists can flex around NRI schedules",
  "Is affordable — India-based therapists typically charge $39–$141/session vs. $150–$300 locally",
];

const faqs = [
  {
    q: "What is NRI mental health?",
    a: "NRI mental health refers to the psychological wellbeing challenges unique to Non-Resident Indians living outside India. Common challenges include bicultural identity conflicts, family pressure across time zones, visa and immigration anxiety, cultural isolation, and the psychological burden of being the family's financial anchor abroad.",
  },
  {
    q: "Do NRIs have higher rates of mental health problems?",
    a: "Research consistently shows that immigrant populations — including NRIs — face elevated rates of depression, anxiety, and loneliness compared to both their home-country peers and host-country populations. The combination of cultural dislocation, family separation, and identity ambiguity creates compounded risk factors.",
  },
  {
    q: "Why can't NRIs just see a local therapist in their country?",
    a: "Local therapists in Western countries are often unfamiliar with Indian cultural dynamics — joint family systems, arranged marriage, izzat, and immigration stress. Well-meaning but culturally uninformed advice (like 'set boundaries with your parents') can be actively harmful. NRIs frequently report feeling more misunderstood in Western therapy than supported.",
  },
  {
    q: "How does online therapy work for NRIs?",
    a: "Online therapy for NRIs works through secure video platforms. You book with an India-based therapist who understands NRI life, choose a session time that works across your timezone, pay securely online, and attend from wherever you are in the world. India Therapist coordinates the full process — from matching to scheduling to payment.",
  },
  {
    q: "How much does therapy for NRIs cost?",
    a: "India Therapist sessions range from $39 to $141 per 60-minute session depending on the therapist's tier and experience. This is 60–80% less than what equivalent therapy costs in Australia ($150–$300/session), USA ($150–$300), UK (£80–£150), or Canada (CAD $150–$250).",
  },
  {
    q: "Which Indian languages are available for NRI therapy?",
    a: "India Therapist offers therapy in Hindi, Tamil, Telugu, Gujarati, Marathi, Kannada, Malayalam, Punjabi, Bengali, Urdu, and English. You can filter therapists by language on the platform.",
  },
];

// ─────────────────────────────────────────────────────────────
// JSON-LD
// ─────────────────────────────────────────────────────────────

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "NRI Mental Health: Challenges, Statistics, and Support",
  description:
    "The definitive guide to mental health challenges faced by NRIs — loneliness, visa anxiety, cultural identity, and family pressure.",
  url: `${APP_URL}/nri-mental-health`,
  image: `${APP_URL}/logo.png`,
  datePublished: "2026-03-25",
  dateModified: "2026-03-25",
  author: {
    "@type": "Organization",
    name: "India Therapist Clinical Team",
    url: APP_URL,
  },
  publisher: {
    "@type": "Organization",
    name: "India Therapist",
    url: APP_URL,
    logo: { "@type": "ImageObject", url: `${APP_URL}/logo.png` },
  },
  mainEntityOfPage: { "@type": "WebPage", "@id": `${APP_URL}/nri-mental-health` },
};

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function NriMentalHealthPage() {
  const faqSchema = getFaqSchema(faqs);

  return (
    <>
      <JsonLd schema={articleSchema} />
      <JsonLd schema={faqSchema} />
      <Navbar />

      <main className="bg-white">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-[#F8F5FF] via-[#F0EBFF] to-[#E0D5FF] py-16 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-medium text-[#7B5FB8] mb-3 uppercase tracking-wide">
              India Therapist Clinical Team · March 2026
            </p>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              NRI Mental Health: Challenges, Statistics, and Support
            </h1>

            {/* Answer capsule — AI citation target */}
            <p className="text-lg text-gray-700 leading-relaxed border-l-4 border-[#7B5FB8] pl-5">
              NRI mental health refers to the psychological wellbeing challenges unique to
              Non-Resident Indians living outside India. Common NRI mental health challenges
              include bicultural identity conflicts, family pressure across time zones, visa
              and immigration anxiety, cultural isolation, and the psychological burden of
              being the family&apos;s financial anchor abroad. India Therapist connects NRIs
              with India-based therapists who specialise in these challenges — available in
              11 Indian languages, from $39/session.
            </p>
          </div>
        </section>

        {/* ── Article body ─────────────────────────────────────── */}
        <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">

          {/* The 6 challenges */}
          <section className="mb-16">
            <h2
              className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              The 6 Most Common NRI Mental Health Challenges
            </h2>
            <div className="space-y-8">
              {challenges.map((c) => (
                <div key={c.title} className="rounded-2xl bg-[#F8F5FF] p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{c.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Why Western therapy fails */}
          <section className="mb-16">
            <h2
              className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Why Western Therapists Often Fail NRIs
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Many NRIs have tried therapy in their adopted country and left feeling more
              misunderstood than when they arrived. This is not because Western therapists
              aren&apos;t skilled — it&apos;s because NRI experiences require specific
              cultural context to address effectively.
            </p>
            <div className="space-y-4">
              {whyWesternFails.map((item) => (
                <div key={item.point} className="border-l-4 border-[#A78BDE] pl-5">
                  <p className="font-semibold text-gray-900 mb-1">{item.point}</p>
                  <p className="text-gray-600 leading-relaxed text-sm">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>

          {/* What to look for */}
          <section className="mb-16">
            <h2
              className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              What to Look for in a Therapist as an NRI
            </h2>
            <ul className="space-y-3">
              {whatToLookFor.map((item) => (
                <li key={item} className="flex items-start gap-3 text-gray-600 leading-relaxed">
                  <span className="mt-1 h-5 w-5 shrink-0 flex items-center justify-center rounded-full bg-[#7B5FB8] text-white text-xs font-bold">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* How online therapy works */}
          <section className="mb-16">
            <h2
              className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Online Therapy for NRIs: How It Works
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              India Therapist is an online therapy platform built exclusively for NRIs.
              Booking a session takes three steps:
            </p>
            <div className="space-y-4">
              {[
                {
                  step: "1",
                  title: "Complete a 2-minute intake form",
                  body: "Tell us your name, contact details, language preference, what you're going through, and your availability. No long questionnaires.",
                },
                {
                  step: "2",
                  title: "Get matched with your therapist",
                  body: "Our platform matches you with the right therapist based on your language, concerns, and schedule. You can also browse the full directory and choose directly.",
                },
                {
                  step: "3",
                  title: "Attend your session from anywhere",
                  body: "Pay securely via Stripe and attend your 60-minute session via video call — from your home in Sydney, your office in San Francisco, or your apartment in Dubai.",
                },
              ].map((s) => (
                <div key={s.step} className="flex gap-4 items-start">
                  <div className="shrink-0 h-8 w-8 rounded-full bg-[#7B5FB8] text-white flex items-center justify-center font-bold text-sm">
                    {s.step}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{s.title}</p>
                    <p className="text-gray-600 text-sm leading-relaxed mt-1">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/therapists"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#7B5FB8] px-8 py-3 text-sm font-semibold text-white hover:bg-[#6B4AA0] transition-colors"
              >
                Browse Therapists →
              </Link>
              <Link
                href="/book"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#7B5FB8] px-8 py-3 text-sm font-semibold text-[#7B5FB8] hover:bg-[#7B5FB8]/5 transition-colors"
              >
                Book a Session
              </Link>
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h2
              className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Frequently Asked Questions: NRI Mental Health
            </h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-2xl bg-[#F8F5FF] border border-gray-100"
                >
                  <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-semibold text-gray-900 hover:text-[#7B5FB8] transition-colors [&::-webkit-details-marker]:hidden list-none">
                    <span>{faq.q}</span>
                    <svg
                      className="h-5 w-5 shrink-0 text-[#7B5FB8] transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-6 text-gray-600 leading-relaxed">{faq.a}</div>
                </details>
              ))}
            </div>
          </section>
        </article>
      </main>

      <footer className="bg-[#7B5FB8] text-[#C4B5F0] text-center py-8 px-4 text-sm border-t border-white/10">
        © 2026 India Therapist. All rights reserved. ·{" "}
        <Link href="/therapists" className="hover:text-white underline">
          Find a Therapist
        </Link>
      </footer>
    </>
  );
}
