import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/SEO/JsonLd";
import { getFaqSchema } from "@/lib/schemas";
import { LOCATIONS, LOCATION_MAP } from "@/lib/locationData";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.indiatherapist.com";
const WA_LINK = "https://wa.me/14254424167";

// Only generate the specific location slugs — all others → 404
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCATIONS.map((loc) => ({ locationSlug: loc.pageSlug }));
}

// ─────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locationSlug: string }>;
}): Promise<Metadata> {
  const { locationSlug } = await params;
  const loc = LOCATION_MAP[locationSlug];
  if (!loc) return {};

  const title =
    loc.type === "country"
      ? `Indian Therapist for NRIs in ${loc.displayName} | Online Therapy in Your Language`
      : `Online ${loc.primaryLanguages[0]} Therapist for NRIs | India Therapist`;

  const description =
    loc.type === "country"
      ? `${loc.population} of Indians in ${loc.displayName}. Find experienced Indian therapists online who understand NRI life — available in ${loc.primaryLanguages.slice(0, 3).join(", ")} & more. From $39/session.`
      : `${loc.population} worldwide. Connect with ${loc.primaryLanguages[0]}-speaking therapists who understand NRI life and culture. Online therapy from $39/session.`;

  const canonicalUrl = `${APP_URL}/${locationSlug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      images: [
        {
          url: `${APP_URL}/logo.png`,
          width: 1200,
          height: 630,
          alt: "India Therapist",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${APP_URL}/logo.png`],
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default async function LocationPage({
  params,
}: {
  params: Promise<{ locationSlug: string }>;
}) {
  const { locationSlug } = await params;
  const loc = LOCATION_MAP[locationSlug];
  if (!loc) notFound();

  const h1 =
    loc.type === "country"
      ? `Online Indian Therapist for NRIs in ${loc.displayName}`
      : `Online Therapy in ${loc.primaryLanguages[0]} for NRIs Worldwide`;

  const answerCapsule =
    loc.type === "country"
      ? `India Therapist connects Indians living in ${loc.displayName} with experienced India-based therapists who understand NRI life. With ${loc.population} of Indians in ${loc.displayName}, finding a therapist who understands your cultural background without lengthy explanation is essential. Sessions are available in ${loc.primaryLanguages.join(", ")}, from $39/session, across all time zones.`
      : `India Therapist connects ${loc.primaryLanguages[0]}-speaking NRIs worldwide with experienced India-based therapists who conduct sessions entirely in ${loc.primaryLanguages[0]}. With ${loc.population} globally, our therapists understand the cultural nuances, family dynamics, and NRI challenges unique to your community — from $39/session.`;

  const therapistFilterUrl =
    loc.primaryLanguages.length === 1
      ? `/therapists?language=${encodeURIComponent(loc.primaryLanguages[0])}`
      : `/therapists`;

  const whyPoints = [
    {
      icon: "⏰",
      title: "Perfect timezone match",
      body: loc.timezoneNote,
    },
    {
      icon: "🗣️",
      title: `Therapy in ${loc.primaryLanguages.slice(0, 2).join(" & ")}`,
      body:
        loc.type === "country"
          ? `We have therapists fluent in ${loc.primaryLanguages.join(", ")} — so you can express yourself in the language you naturally think and feel in.`
          : `Sessions conducted entirely in ${loc.primaryLanguages[0]} — no switching to English, no translation, no emotional distance.`,
    },
    {
      icon: "🧠",
      title: "Cultural understanding without explanation",
      body:
        loc.type === "country"
          ? `Your therapist will immediately understand the pressures of NRI life in ${loc.displayName} — visa anxiety, family expectations, identity tensions — without needing a cultural briefing.`
          : `Your therapist already understands the cultural context — the family dynamics, the community pressures, the emotional vocabulary — specific to ${loc.primaryLanguages[0]}-speaking communities.`,
    },
    {
      icon: "💰",
      title: "60–80% more affordable than local therapy",
      body:
        loc.type === "country"
          ? `Local therapists in ${loc.displayName} charge significantly more per session. India Therapist starts at $39 — qualified Indian therapists at a fraction of the cost, with culturally superior relevance.`
          : `Sessions from $39/session — far more affordable than therapy in the US, UK, Canada, or Singapore, without compromising on quality or cultural fit.`,
    },
  ];

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": ["MedicalBusiness", "HealthAndBeautyBusiness"],
    name: "India Therapist",
    url: APP_URL,
    logo: `${APP_URL}/logo.png`,
    description: answerCapsule,
    areaServed: loc.type === "country" ? loc.displayName : "Worldwide",
    availableLanguage: loc.primaryLanguages,
    priceRange: "$39–$141",
    sameAs: ["https://www.facebook.com/indiatherapist"],
  };

  const faqSchema = getFaqSchema(loc.faq);

  return (
    <>
      <JsonLd schema={orgSchema} />
      <JsonLd schema={faqSchema} />
      <Navbar />

      <main>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#F8F5FF] via-[#F0EBFF] to-[#E0D5FF] py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
          <div
            aria-hidden
            className="absolute -top-24 -right-24 h-[500px] w-[500px] rounded-full bg-[#7B5FB8]/5 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -left-24 h-[400px] w-[400px] rounded-full bg-[#A78BDE]/10 blur-3xl"
          />

          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#7B5FB8]/20 bg-[#7B5FB8]/8 px-4 py-1.5 text-sm font-medium text-[#7B5FB8]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7B5FB8] animate-pulse" />
              {loc.population}
            </div>

            <h1
              className="text-3xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {h1}
            </h1>

            {/* Answer capsule — optimised for AI citation */}
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-10 max-w-3xl mx-auto">
              {answerCapsule}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={therapistFilterUrl}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#7B5FB8] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#7B5FB8]/25 hover:bg-[#6B4AA0] transition-all hover:-translate-y-0.5"
              >
                Find Your Therapist →
              </Link>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full border-2 border-[#25D366] px-8 py-4 text-base font-semibold text-[#7B5FB8] hover:bg-[#25D366]/10 transition-colors"
              >
                <svg
                  className="h-5 w-5 text-[#25D366]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* ── Why Choose Us ────────────────────────────────────── */}
        <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center mb-14">
              <h2
                className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Why NRIs in {loc.displayName} choose India Therapist
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {whyPoints.map((point) => (
                <div
                  key={point.title}
                  className="rounded-2xl border border-gray-100 bg-[#F8F5FF] p-8 hover:border-[#7B5FB8]/20 hover:shadow-sm transition-all"
                >
                  <div className="mb-4 text-4xl">{point.icon}</div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    {point.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed">{point.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Challenges ───────────────────────────────────────── */}
        <section className="bg-[#F8F5FF] py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center mb-14">
              <h2
                className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                {loc.type === "country"
                  ? `Common challenges NRIs face in ${loc.displayName}`
                  : `Common challenges for ${loc.primaryLanguages[0]}-speaking NRIs`}
              </h2>
              <p className="text-gray-500 text-lg">
                Our therapists specialise in these experiences — you won&apos;t
                need to explain them.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {loc.specificChallenges.map((challenge) => (
                <div
                  key={challenge.title}
                  className="rounded-2xl bg-white border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow"
                >
                  <h3 className="mb-3 text-lg font-semibold text-gray-900">
                    {challenge.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed">
                    {challenge.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Find Therapist CTA ───────────────────────────────── */}
        <section className="bg-[#7B5FB8] py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2
              className="text-3xl sm:text-4xl font-bold text-white mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {loc.type === "country"
                ? `Find your ${loc.displayName} NRI therapist`
                : `Find your ${loc.primaryLanguages[0]}-speaking therapist`}
            </h2>
            <p className="text-[#C4B5F0] text-lg mb-8 max-w-2xl mx-auto">
              Browse our full directory of verified Indian therapists. Filter by
              language, speciality, and session rate. Your first session is
              risk-free.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={therapistFilterUrl}
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-[#7B5FB8] shadow-lg hover:bg-gray-50 transition-all hover:-translate-y-0.5"
              >
                Browse All Therapists →
              </Link>
              <Link
                href="/book"
                className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 px-8 py-4 text-base font-semibold text-white hover:border-white/80 transition-colors"
              >
                Book a Session
              </Link>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section className="bg-[#F8F5FF] py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-14">
              <h2
                className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                {loc.type === "country"
                  ? `Therapy for NRIs in ${loc.displayName} — FAQ`
                  : `${loc.primaryLanguages[0]} Online Therapy — FAQ`}
              </h2>
            </div>

            <div className="space-y-4">
              {loc.faq.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl bg-white border border-gray-100 shadow-sm"
                >
                  <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-semibold text-gray-900 hover:text-[#7B5FB8] transition-colors [&::-webkit-details-marker]:hidden list-none">
                    <span>{item.q}</span>
                    <svg
                      className="h-5 w-5 shrink-0 text-[#7B5FB8] transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </summary>
                  <div className="px-6 pb-6 text-gray-500 leading-relaxed">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Book CTA ─────────────────────────────────────────── */}
        <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Book your session from {loc.displayName}
            </h2>
            <p className="text-gray-500 text-lg mb-8">
              From first message to first session in under 24 hours. Risk-free
              first session — full refund if it&apos;s not the right fit.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/book"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#7B5FB8] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#7B5FB8]/25 hover:bg-[#6B4AA0] transition-all hover:-translate-y-0.5"
              >
                Book Your Session →
              </Link>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full border-2 border-gray-200 px-8 py-4 text-base font-semibold text-gray-700 hover:border-[#25D366] hover:text-[#25D366] transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp Us
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
