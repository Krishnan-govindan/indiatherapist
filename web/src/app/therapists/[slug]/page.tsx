import type { Metadata } from "next";
import Link from "next/link";
import BookingCard from "./BookingCard";
import JsonLd from "@/components/SEO/JsonLd";
import { getTherapistsBySlugMap, type TherapistData } from "@/data/therapists";
import { getTherapistSchema, getBreadcrumbSchema } from "@/lib/schemas";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Therapist {
  id: string;
  full_name: string;
  slug: string;
  tier: "premium" | "elite";
  session_rate_cents: number;
  specialties: string[];
  languages: string[];
  experience_years: number | null;
  photo_url: string | null;
  bio: string | null;
  education: string | null;
  credentials: string | null;
  therapy_types: string[] | null;
  whatsapp_number: string | null;
  city: string | null;
  country: string | null;
}

// ─────────────────────────────────────────────────────────────
// Fallback data (all real therapists)
// ─────────────────────────────────────────────────────────────

const FALLBACK: Record<string, Therapist> = Object.fromEntries(
  Object.entries(getTherapistsBySlugMap()).map(([slug, t]: [string, TherapistData]) => [
    slug,
    {
      id: t.id,
      full_name: t.full_name,
      slug: t.slug,
      tier: t.tier,
      session_rate_cents: t.session_rate_cents,
      specialties: t.specialties,
      languages: t.languages,
      experience_years: t.experience_years,
      photo_url: t.photo_url,
      bio: t.bio,
      education: t.education,
      credentials: t.credentials,
      therapy_types: t.therapy_types,
      whatsapp_number: t.whatsapp_number,
      city: t.city,
      country: t.country,
    },
  ])
);

// ─────────────────────────────────────────────────────────────
// Language → flag emoji
// ─────────────────────────────────────────────────────────────

const LANG_FLAG: Record<string, string> = {
  Hindi: "🇮🇳",
  Tamil: "🇮🇳",
  Telugu: "🇮🇳",
  Gujarati: "🇮🇳",
  Marathi: "🇮🇳",
  Kannada: "🇮🇳",
  Malayalam: "🇮🇳",
  Punjabi: "🇮🇳",
  Bengali: "🇮🇳",
  English: "🇬🇧",
  French: "🇫🇷",
  German: "🇩🇪",
};

// ─────────────────────────────────────────────────────────────
// Data fetching
// ─────────────────────────────────────────────────────────────

async function fetchTherapist(slug: string): Promise<Therapist | null> {
  try {
    const apiUrl = process.env.API_URL ?? "http://localhost:3001";
    const res = await fetch(`${apiUrl}/api/therapists/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("not found");
    return await res.json();
  } catch {
    return FALLBACK[slug] ?? null;
  }
}

// ─────────────────────────────────────────────────────────────
// generateMetadata
// ─────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = await fetchTherapist(slug);
  if (!t) return { title: "Therapist Not Found | India Therapist" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.indiatherapist.com";
  const topSpecialty = t.specialties[0] ?? "Mental Health";
  const top2Specialties = t.specialties.slice(0, 2).join(" & ");
  const langList = t.languages.join(", ");
  const rate = (t.session_rate_cents / 100).toFixed(0);
  const canonicalUrl = `${appUrl}/therapists/${t.slug}`;

  const title = `${t.full_name} — Indian ${topSpecialty} Therapist for NRIs`;
  const description =
    `Book online therapy with ${t.full_name}` +
    (t.experience_years ? `, ${t.experience_years} years experience` : "") +
    `. Specializes in ${top2Specialties}. Sessions in ${langList}. $${rate}/session. Trusted by NRIs worldwide.`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${t.full_name} | India Therapist`,
      description: t.bio?.slice(0, 160) ?? description,
      url: canonicalUrl,
      type: "profile",
      images: t.photo_url
        ? [{ url: t.photo_url, alt: t.full_name }]
        : [{ url: `${appUrl}/og-default.png`, width: 1200, height: 630, alt: "India Therapist" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${t.full_name} | India Therapist`,
      description: description.slice(0, 200),
      images: t.photo_url ? [t.photo_url] : [`${appUrl}/og-default.png`],
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Avatar initials
// ─────────────────────────────────────────────────────────────

function AvatarInitials({ name, large }: { name: string; large?: boolean }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
  const size = large ? "h-28 w-28 sm:h-36 sm:w-36 text-4xl sm:text-5xl" : "h-16 w-16 text-xl";
  return (
    <div
      className={`${size} rounded-full bg-[#7B5FB8]/10 flex items-center justify-center shrink-0`}
    >
      <span className={`font-semibold text-[#7B5FB8]`}>{initials}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default async function TherapistProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const therapist = await fetchTherapist(slug);

  if (!therapist) {
    return (
      <main className="min-h-screen bg-[#F8F5FF] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Therapist not found</h1>
          <p className="text-gray-500 mb-6">
            This therapist profile doesn&apos;t exist or may have moved.
          </p>
          <Link
            href="/therapists"
            className="rounded-full bg-[#7B5FB8] px-6 py-3 text-sm font-semibold text-white hover:bg-[#6B4AA0] transition-colors"
          >
            Browse All Therapists
          </Link>
        </div>
      </main>
    );
  }

  const rate = (therapist.session_rate_cents / 100).toFixed(0);
  const isElite = therapist.tier === "elite";
  const top2Specialties = therapist.specialties.slice(0, 2).join(" & ");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.indiatherapist.com";

  // JSON-LD: Person + Physician schema
  const jsonLd = getTherapistSchema(therapist);

  // JSON-LD: Breadcrumb schema
  const breadcrumbLd = getBreadcrumbSchema([
    { name: "Home", url: appUrl },
    { name: "Therapists", url: `${appUrl}/therapists` },
    { name: therapist.full_name, url: `${appUrl}/therapists/${therapist.slug}` },
  ]);

  return (
    <>
      {/* JSON-LD */}
      <JsonLd schema={jsonLd} />
      <JsonLd schema={breadcrumbLd} />

      <main className="min-h-screen bg-[#F8F5FF]">
        {/* ── Breadcrumb ───────────────────────────────────── */}
        <div className="bg-white border-b border-gray-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <nav className="text-sm text-gray-500 flex items-center gap-2">
              <Link href="/" className="hover:text-[#7B5FB8] transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link href="/therapists" className="hover:text-[#7B5FB8] transition-colors">
                Therapists
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">{therapist.full_name}</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="lg:grid lg:grid-cols-3 lg:gap-10">
            {/* ── Main column ────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-8">

              {/* HEADER SECTION */}
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                  {/* Photo */}
                  {therapist.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={therapist.photo_url}
                      alt={therapist.full_name}
                      className="h-28 w-28 sm:h-36 sm:w-36 rounded-full object-cover shrink-0 mx-auto sm:mx-0"
                    />
                  ) : (
                    <div className="mx-auto sm:mx-0">
                      <AvatarInitials name={therapist.full_name} large />
                    </div>
                  )}

                  {/* Info */}
                  <div className="text-center sm:text-left">
                    {/* Name + verified */}
                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-1">
                      <h1
                        className="text-2xl sm:text-3xl font-bold text-gray-900"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        {therapist.full_name}
                      </h1>
                      <span
                        title="Verified therapist"
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#7B5FB8] text-white text-xs shrink-0"
                      >
                        ✓
                      </span>
                    </div>

                    {/* Tier badge */}
                    <span
                      className={`inline-block mb-3 rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        isElite
                          ? "bg-amber-100 text-amber-800"
                          : "bg-[#7B5FB8]/10 text-[#7B5FB8]"
                      }`}
                    >
                      {therapist.tier}
                    </span>

                    {/* Specialty summary */}
                    <p className="text-gray-600 mb-3">
                      Specializes in{" "}
                      <span className="font-medium text-gray-900">
                        {top2Specialties}
                      </span>
                    </p>

                    {/* Languages */}
                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-3">
                      {therapist.languages.map((lang) => (
                        <span
                          key={lang}
                          className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                        >
                          {LANG_FLAG[lang] ?? "🌐"} {lang}
                        </span>
                      ))}
                    </div>

                    {/* Experience */}
                    {therapist.experience_years && (
                      <p className="text-sm text-gray-500 mb-3">
                        🏅{" "}
                        <span className="font-medium text-gray-700">
                          {therapist.experience_years} years
                        </span>{" "}
                        of clinical experience
                      </p>
                    )}

                    {/* Rate badge */}
                    <div className="inline-flex items-center gap-2 rounded-xl bg-[#F0EBFF] border border-[#C4B5F0] px-4 py-2">
                      <span className="text-[#7B5FB8] font-bold text-lg">${rate}</span>
                      <span className="text-[#6B4AA0] text-sm">per 60-min session</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* ABOUT SECTION */}
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                <h2
                  className="text-xl font-bold text-gray-900 mb-4"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  About
                </h2>
                {therapist.bio && (
                  <p className="text-gray-600 leading-relaxed mb-6 whitespace-pre-line">
                    {therapist.bio}
                  </p>
                )}

                {/* Education / credentials */}
                {(therapist.education || therapist.credentials) && (
                  <div className="border-t border-gray-100 pt-5 space-y-3">
                    {therapist.education && (
                      <div className="flex items-start gap-3">
                        <span className="text-lg shrink-0 mt-0.5">🎓</span>
                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">
                            Education
                          </p>
                          <p className="text-sm text-gray-700">{therapist.education}</p>
                        </div>
                      </div>
                    )}
                    {therapist.credentials && (
                      <div className="flex items-start gap-3">
                        <span className="text-lg shrink-0 mt-0.5">📜</span>
                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">
                            Credentials
                          </p>
                          <p className="text-sm text-gray-700">{therapist.credentials}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* SPECIALTIES SECTION */}
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                <h2
                  className="text-xl font-bold text-gray-900 mb-5"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  Areas of Expertise
                </h2>
                <div className="flex flex-wrap gap-2 mb-6">
                  {therapist.specialties.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-[#A78BDE]/15 px-3 py-1.5 text-sm font-medium text-[#6B4AA0]"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                {/* Therapy types */}
                {therapist.therapy_types && therapist.therapy_types.length > 0 && (
                  <>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Therapy Approaches
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {therapist.therapy_types.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-[#7B5FB8]/30 bg-[#7B5FB8]/5 px-3 py-1.5 text-sm text-[#7B5FB8]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </section>

              {/* WHAT TO EXPECT SECTION */}
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                <h2
                  className="text-xl font-bold text-gray-900 mb-4"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  What to Expect
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Your first session is a safe space to share what&apos;s on your mind.{" "}
                  <span className="font-medium text-gray-800">
                    {therapist.full_name.split(" ")[0]}
                  </span>{" "}
                  will listen without judgment and help you understand a path forward.
                  Sessions are 60 minutes via video call — you can attend from wherever
                  you are in the world, in your language, at a time that suits you.
                </p>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { icon: "🎥", label: "Video call", sub: "Attend from anywhere" },
                    { icon: "🔐", label: "Confidential", sub: "Your privacy is protected" },
                    { icon: "🌏", label: "NRI-aware", sub: "No cultural explanations needed" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl bg-[#F8F5FF] p-4 text-center"
                    >
                      <div className="text-2xl mb-1">{item.icon}</div>
                      <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
                    </div>
                  ))}
                </div>
              </section>

            </div>

            {/* ── Sidebar — sticky booking card ───────────────── */}
            <div className="mt-8 lg:mt-0">
              <div className="lg:sticky lg:top-6">
                <BookingCard
                  therapistName={therapist.full_name}
                  therapistSlug={therapist.slug}
                  sessionRateCents={therapist.session_rate_cents}
                  waNumber={therapist.whatsapp_number}
                />

                {/* Location pill */}
                {therapist.city && (
                  <p className="mt-4 text-center text-sm text-gray-400">
                    📍 Based in {therapist.city}
                    {therapist.country ? `, ${therapist.country}` : ""}
                  </p>
                )}

                {/* Back link */}
                <div className="mt-6 text-center">
                  <Link
                    href="/therapists"
                    className="text-sm text-[#7B5FB8] hover:underline"
                  >
                    ← Browse other therapists
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
