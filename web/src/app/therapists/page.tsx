"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ALL_THERAPISTS } from "@/data/therapists";
import { getItemListSchema } from "@/lib/schemas";

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
}

type SortOption = "best_match" | "experience" | "rate_asc";
type TierFilter = "all" | "premium" | "elite";

interface TherapistWithMatch extends Therapist {
  matchScore: number;
  isMatch: boolean;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const LANGUAGES = [
  "All Languages",
  "Hindi",
  "Tamil",
  "Telugu",
  "Gujarati",
  "Marathi",
  "Kannada",
  "Malayalam",
  "Punjabi",
  "Urdu",
  "Haryanvi",
  "Marwari",
  "English",
];

const SPECIALTIES = [
  "Anxiety",
  "Depression",
  "Relationship",
  "Couples",
  "Marriage",
  "Family",
  "Parenting",
  "Trauma",
  "Grief",
  "Divorce",
  "Career",
  "Self-Esteem",
  "Burnout",
  "Identity",
];

const TIER_OPTIONS: { value: TierFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "premium", label: "Premium ($39-$77)" },
  { value: "elite", label: "Elite ($91-$141)" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "best_match", label: "Best Match" },
  { value: "experience", label: "Experience" },
  { value: "rate_asc", label: "Rate (Low to High)" },
];

// ─────────────────────────────────────────────────────────────
// Skeleton card
// ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm animate-pulse">
      <div className="flex items-start gap-4 mb-4">
        <div className="h-16 w-16 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-5 bg-gray-200 rounded-full w-16" />
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <div className="h-5 bg-gray-200 rounded-full w-16" />
        <div className="h-5 bg-gray-200 rounded-full w-20" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
      </div>
      <div className="flex gap-3 mt-auto pt-2">
        <div className="h-9 bg-gray-200 rounded-full flex-1" />
        <div className="h-9 bg-gray-200 rounded-full flex-1" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Avatar initials
// ─────────────────────────────────────────────────────────────

function AvatarInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
  return (
    <div className="h-28 w-28 rounded-full bg-[#7B5FB8]/10 flex items-center justify-center shrink-0">
      <span className="text-xl font-semibold text-[#7B5FB8]">{initials}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Therapist card
// ─────────────────────────────────────────────────────────────

function TherapistCard({ therapist }: { therapist: Therapist }) {
  const rate = (therapist.session_rate_cents / 100).toFixed(0);
  const isElite = therapist.tier === "elite";

  return (
    <div className={`group rounded-2xl bg-white p-8 shadow-sm hover:shadow-lg transition-all flex flex-col ${
      isElite
        ? "border-2 border-amber-300 ring-1 ring-amber-200/50"
        : "border-2 border-[#7B5FB8]/30"
    }`}>
      {/* Elite ribbon */}
      {isElite && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-50 to-amber-100 px-3 py-1.5 -mt-2">
          <span className="text-amber-600 text-sm">⭐</span>
          <span className="text-xs font-bold uppercase tracking-wide text-amber-700">Elite Therapist</span>
        </div>
      )}

      {/* Avatar + name row */}
      <div className="flex items-start gap-5 mb-5">
        {therapist.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={therapist.photo_url}
            alt={therapist.full_name}
            className={`h-28 w-28 rounded-full object-cover shrink-0 ${
              isElite ? "ring-3 ring-amber-300" : "ring-3 ring-[#7B5FB8]/30"
            }`}
          />
        ) : (
          <AvatarInitials name={therapist.full_name} />
        )}

        <div className="min-w-0">
          {/* Name + verified */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">
              {therapist.full_name}
            </h3>
            <span
              title="Verified therapist"
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-white text-xs shrink-0 ${
                isElite ? "bg-amber-500" : "bg-[#7B5FB8]"
              }`}
            >
              ✓
            </span>
          </div>

          {/* Experience */}
          {therapist.experience_years && (
            <p className="text-base text-gray-600 mt-1">
              {therapist.experience_years} years experience
            </p>
          )}

          {/* Tier badge */}
          <span
            className={`inline-block mt-2 rounded-full px-3 py-1 text-sm font-semibold capitalize ${
              isElite
                ? "bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border border-amber-300"
                : "bg-[#7B5FB8]/10 text-[#7B5FB8] border border-[#7B5FB8]/20"
            }`}
          >
            {therapist.tier}
          </span>
        </div>
      </div>

      {/* Specialty tags — purple */}
      <div className="flex flex-wrap gap-2 mb-4">
        {therapist.specialties.slice(0, 3).map((s) => (
          <span
            key={s}
            className="rounded-full bg-[#7B5FB8]/12 border border-[#7B5FB8]/20 px-3 py-1 text-sm font-medium text-[#553888]"
          >
            {s}
          </span>
        ))}
      </div>

      {/* Language badges — teal/blue-green to differentiate from specialties */}
      <div className="flex flex-wrap gap-2 mb-4">
        {therapist.languages.map((lang) => (
          <span
            key={lang}
            className="rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-sm font-medium text-teal-700 hover:bg-teal-100 transition-colors duration-200 cursor-default"
          >
            🗣️ {lang}
          </span>
        ))}
      </div>

      {/* Bio excerpt */}
      {therapist.bio && (
        <p className="text-base text-gray-800 line-clamp-2 mb-5 flex-1">
          {therapist.bio}
        </p>
      )}

      {/* Rate + CTAs */}
      <div className="mt-auto">
        <p className="text-xl font-bold text-gray-900 mb-3">
          ${rate}
          <span className="text-base font-normal text-gray-400">/session</span>
        </p>
        <div className="flex gap-3">
          <Link
            href={`/therapists/${therapist.slug}`}
            className="flex-1 rounded-full border border-[#7B5FB8] px-5 py-3 text-base font-semibold text-[#7B5FB8] hover:bg-[#7B5FB8] hover:text-white transition-colors text-center"
          >
            View Profile
          </Link>
          <Link
            href={`/book?therapist=${therapist.slug}`}
            className={`flex-1 rounded-full px-5 py-3 text-base font-semibold text-white transition-colors text-center ${
              isElite
                ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                : "bg-[#7B5FB8] hover:bg-[#6B4AA0]"
            }`}
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Filter bar
// ─────────────────────────────────────────────────────────────

interface FilterBarProps {
  language: string;
  setLanguage: (v: string) => void;
  selectedSpecialties: string[];
  toggleSpecialty: (s: string) => void;
  tier: TierFilter;
  setTier: (v: TierFilter) => void;
  sort: SortOption;
  setSort: (v: SortOption) => void;
  search: string;
  setSearch: (v: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

function FilterBar({
  language,
  setLanguage,
  selectedSpecialties,
  toggleSpecialty,
  tier,
  setTier,
  sort,
  setSort,
  search,
  setSearch,
  mobileOpen,
  setMobileOpen,
}: FilterBarProps) {
  const activeCount =
    (language !== "All Languages" ? 1 : 0) +
    selectedSpecialties.length +
    (tier !== "all" ? 1 : 0);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-8">
      {/* Mobile toggle */}
      <div className="flex items-center justify-between p-4 sm:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 12h10M11 20h2" />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-[#7B5FB8] text-white text-xs px-1.5 py-0.5">
              {activeCount}
            </span>
          )}
        </button>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-full border border-gray-200 px-4 py-1.5 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-[#7B5FB8]/30"
          />
        </div>
      </div>

      {/* Desktop layout / mobile expanded */}
      <div
        className={`${
          mobileOpen ? "block" : "hidden"
        } sm:block p-4 sm:p-5 border-t border-gray-100 sm:border-0`}
      >
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Search — desktop only */}
          <div className="hidden sm:block flex-1 min-w-0">
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B5FB8]/30"
            />
          </div>

          {/* Language */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B5FB8]/30 bg-white"
            >
              {LANGUAGES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Sort by
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B5FB8]/30 bg-white"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tier toggle removed — user requested removal */}
        </div>

        {/* Specialty chips */}
        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
            Concern / Specialty
          </label>
          <div className="flex flex-wrap gap-2">
            {SPECIALTIES.map((s) => {
              const active = selectedSpecialties.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleSpecialty(s)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors border ${
                    active
                      ? "bg-[#7B5FB8] text-white border-[#7B5FB8]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#7B5FB8] hover:text-[#7B5FB8]"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────

function scoreTherapist(
  t: Therapist,
  search: string,
  language: string,
  selectedSpecialties: string[],
  tier: TierFilter
): { isMatch: boolean; matchScore: number } {
  let matchScore = 0;
  let isMatch = true;

  // Name search
  if (search.trim()) {
    const q = search.toLowerCase();
    if (!t.full_name.toLowerCase().includes(q)) isMatch = false;
    else matchScore += 3;
  }

  // Language filter
  if (language !== "All Languages") {
    const langMatch = t.languages.some(
      (l) => l.toLowerCase() === language.toLowerCase()
    );
    if (!langMatch) isMatch = false;
    else matchScore += 2;
  }

  // Specialty filter
  if (selectedSpecialties.length > 0) {
    const matched = selectedSpecialties.filter((s) =>
      t.specialties.some((ts) => ts.toLowerCase().includes(s.toLowerCase()))
    );
    if (matched.length < selectedSpecialties.length) isMatch = false;
    matchScore += matched.length;
  }

  // Tier filter
  if (tier !== "all") {
    if (t.tier !== tier) isMatch = false;
    else matchScore += 1;
  }

  return { isMatch, matchScore };
}

export default function TherapistsPage() {
  const [allTherapists, setAllTherapists] = useState<Therapist[]>([]);
  const [matched, setMatched] = useState<TherapistWithMatch[]>([]);
  const [suggestions, setSuggestions] = useState<TherapistWithMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("All Languages");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [tier, setTier] = useState<TierFilter>("all");
  const [sort, setSort] = useState<SortOption>("best_match");
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSpecialty = (s: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const fetchTherapists = useCallback(async () => {
    setVisible(false);
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
      const res = await fetch(`${apiUrl}/api/therapists`);
      let data: Therapist[] = [];
      if (res.ok) {
        const json = await res.json();
        const raw = json?.therapists ?? json;
        data = Array.isArray(raw) ? raw : [];
      }
      if (data.length === 0) data = ALL_THERAPISTS as Therapist[];
      setAllTherapists(data);
    } catch {
      setAllTherapists(ALL_THERAPISTS as Therapist[]);
    } finally {
      setLoading(false);
      setTimeout(() => setVisible(true), 50);
    }
  }, []);

  // Apply filters client-side whenever allTherapists or filters change
  useEffect(() => {
    const hasFilters =
      search.trim() ||
      language !== "All Languages" ||
      selectedSpecialties.length > 0 ||
      tier !== "all";

    const scored: TherapistWithMatch[] = allTherapists.map((t) => ({
      ...t,
      ...scoreTherapist(t, search, language, selectedSpecialties, tier),
    }));

    const applySort = (list: TherapistWithMatch[]) => {
      if (sort === "experience")
        return [...list].sort((a, b) => (b.experience_years ?? 0) - (a.experience_years ?? 0));
      if (sort === "rate_asc")
        return [...list].sort((a, b) => a.session_rate_cents - b.session_rate_cents);
      return [...list].sort((a, b) => b.matchScore - a.matchScore);
    };

    if (!hasFilters) {
      setMatched(applySort(scored));
      setSuggestions([]);
    } else {
      const hits = scored.filter((t) => t.isMatch);
      const misses = scored.filter((t) => !t.isMatch);
      setMatched(applySort(hits));
      setSuggestions(applySort(misses));
    }
  }, [allTherapists, search, language, selectedSpecialties, tier, sort]);

  // Fetch all therapists once on mount
  useEffect(() => {
    fetchTherapists();
  }, [fetchTherapists]);

  const itemListSchema = getItemListSchema(ALL_THERAPISTS);

  return (
    <main className="min-h-screen bg-[#F8F5FF]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h1
            className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Find Your Perfect{" "}
            <span className="text-[#7B5FB8]">Indian Therapist</span> Online
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl">
            Connecting NRIs to <strong className="text-gray-800 font-semibold">top Indian therapists.</strong>{" "}
            <strong className="text-[#7B5FB8] font-semibold">Culturally tailored</strong>, affordable,
            and available in 12 languages across all time zones.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter bar */}
        <FilterBar
          language={language}
          setLanguage={setLanguage}
          selectedSpecialties={selectedSpecialties}
          toggleSpecialty={toggleSpecialty}
          tier={tier}
          setTier={setTier}
          sort={sort}
          setSort={setSort}
          search={search}
          setSearch={setSearch}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-gray-700 font-medium mb-5">
            {matched.length === 0 && suggestions.length === 0
              ? "No therapists found"
              : matched.length > 0
              ? `${matched.length} therapist${matched.length !== 1 ? "s" : ""} found`
              : `0 exact matches — showing ${suggestions.length} best alternatives`}
          </p>
        )}

        {/* Grid */}
        <div
          className="transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <>
              {/* Matched results */}
              {matched.length > 0 && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {matched.map((t) => (
                    <TherapistCard key={t.id} therapist={t} />
                  ))}
                </div>
              )}

              {/* Zero matches banner + suggestions */}
              {matched.length === 0 && (
                <div className="mb-8">
                  <div className="flex flex-col items-center justify-center py-10 text-center bg-white rounded-2xl border border-gray-100 shadow-sm mb-8">
                    <div className="text-5xl mb-3">🔍</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      0 exact matches for your filters
                    </h3>
                    <p className="text-gray-600 max-w-md">
                      Here are our best matching therapists that may still help you.
                    </p>
                  </div>

                  {suggestions.length > 0 && (
                    <>
                      <p className="text-sm font-semibold text-[#7B5FB8] mb-4 uppercase tracking-wide">
                        Best matching therapists
                      </p>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {suggestions.map((t) => (
                          <TherapistCard key={t.id} therapist={t} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Suggestions section when there ARE matches */}
              {matched.length > 0 && suggestions.length > 0 && (
                <div className="mt-10">
                  <p className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
                    Other therapists you may like
                  </p>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 opacity-70">
                    {suggestions.map((t) => (
                      <TherapistCard key={t.id} therapist={t} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
