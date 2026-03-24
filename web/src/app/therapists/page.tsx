"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ALL_THERAPISTS } from "@/data/therapists";

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
    <div className="h-16 w-16 rounded-full bg-[#7B5FB8]/10 flex items-center justify-center shrink-0">
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
    <div className="group rounded-2xl bg-white border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* Avatar + name row */}
      <div className="flex items-start gap-4 mb-4">
        {therapist.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={therapist.photo_url}
            alt={therapist.full_name}
            className="h-16 w-16 rounded-full object-cover shrink-0"
          />
        ) : (
          <AvatarInitials name={therapist.full_name} />
        )}

        <div className="min-w-0">
          {/* Name + verified */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-base leading-tight">
              {therapist.full_name}
            </h3>
            <span
              title="Verified therapist"
              className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#7B5FB8] text-white text-[10px] shrink-0"
            >
              ✓
            </span>
          </div>

          {/* Experience */}
          {therapist.experience_years && (
            <p className="text-sm text-gray-500 mt-0.5">
              {therapist.experience_years} years experience
            </p>
          )}

          {/* Tier badge */}
          <span
            className={`inline-block mt-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
              isElite
                ? "bg-amber-100 text-amber-800"
                : "bg-[#7B5FB8]/10 text-[#7B5FB8]"
            }`}
          >
            {therapist.tier}
          </span>
        </div>
      </div>

      {/* Specialty tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {therapist.specialties.slice(0, 3).map((s) => (
          <span
            key={s}
            className="rounded-full bg-[#A78BDE]/15 px-2.5 py-0.5 text-xs font-medium text-[#6B4AA0]"
          >
            {s}
          </span>
        ))}
      </div>

      {/* Language badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {therapist.languages.map((lang) => (
          <span
            key={lang}
            className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
          >
            {lang}
          </span>
        ))}
      </div>

      {/* Bio excerpt */}
      {therapist.bio && (
        <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
          {therapist.bio}
        </p>
      )}

      {/* Rate + CTAs */}
      <div className="mt-auto">
        <p className="text-base font-semibold text-gray-900 mb-3">
          ${rate}
          <span className="text-sm font-normal text-gray-400">/session</span>
        </p>
        <div className="flex gap-2">
          <Link
            href={`/therapists/${therapist.slug}`}
            className="flex-1 rounded-full border border-[#7B5FB8] px-4 py-2 text-sm font-semibold text-[#7B5FB8] hover:bg-[#7B5FB8] hover:text-white transition-colors text-center"
          >
            View Profile
          </Link>
          <Link
            href={`/book?therapist=${therapist.slug}`}
            className="flex-1 rounded-full bg-[#7B5FB8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6B4AA0] transition-colors text-center"
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

          {/* Tier toggle */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Tier
            </label>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
              {TIER_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setTier(o.value)}
                  className={`px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    tier === o.value
                      ? "bg-[#7B5FB8] text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
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

export default function TherapistsPage() {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true); // fade transition

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
      const params = new URLSearchParams();
      if (language !== "All Languages") params.set("language", language);
      if (selectedSpecialties.length > 0)
        params.set("specialty", selectedSpecialties[0]); // API takes one specialty
      if (tier !== "all") params.set("tier", tier);

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
      const res = await fetch(
        `${apiUrl}/api/therapists?${params.toString()}`
      );

      let data: Therapist[] = [];
      if (res.ok) {
        const json = await res.json();
        const raw = json?.therapists ?? json;
        data = Array.isArray(raw) ? raw : [];
      }

      // Fallback to static data if API returns empty
      if (data.length === 0) {
        data = ALL_THERAPISTS as Therapist[];
      }

      // Client-side search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        data = data.filter((t) => t.full_name.toLowerCase().includes(q));
      }

      // Client-side multi-specialty filter (AND logic after first)
      if (selectedSpecialties.length > 1) {
        data = data.filter((t) =>
          selectedSpecialties.every((s) =>
            t.specialties.some((ts) =>
              ts.toLowerCase().includes(s.toLowerCase())
            )
          )
        );
      }

      // Sort
      if (sort === "experience") {
        data = [...data].sort(
          (a, b) => (b.experience_years ?? 0) - (a.experience_years ?? 0)
        );
      } else if (sort === "rate_asc") {
        data = [...data].sort(
          (a, b) => a.session_rate_cents - b.session_rate_cents
        );
      }

      setTherapists(data);
    } catch {
      // Use static therapist data as fallback when API is unavailable
      let data: Therapist[] = ALL_THERAPISTS as Therapist[];

      // Apply client-side filters to fallback data
      if (language !== "All Languages") {
        data = data.filter((t) =>
          t.languages.some((l) => l.toLowerCase() === language.toLowerCase())
        );
      }
      if (tier !== "all") {
        data = data.filter((t) => t.tier === tier);
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        data = data.filter((t) => t.full_name.toLowerCase().includes(q));
      }
      if (selectedSpecialties.length > 0) {
        data = data.filter((t) =>
          selectedSpecialties.every((s) =>
            t.specialties.some((ts) =>
              ts.toLowerCase().includes(s.toLowerCase())
            )
          )
        );
      }
      if (sort === "experience") {
        data = [...data].sort(
          (a, b) => (b.experience_years ?? 0) - (a.experience_years ?? 0)
        );
      } else if (sort === "rate_asc") {
        data = [...data].sort(
          (a, b) => a.session_rate_cents - b.session_rate_cents
        );
      }
      setTherapists(data);
    } finally {
      setLoading(false);
      setTimeout(() => setVisible(true), 50);
    }
  }, [language, selectedSpecialties, tier, sort, search]);

  // Debounced fetch on filter change
  useEffect(() => {
    const timer = setTimeout(fetchTherapists, 300);
    return () => clearTimeout(timer);
  }, [fetchTherapists]);

  return (
    <main className="min-h-screen bg-[#F8F5FF]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h1
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Find Your Perfect Indian Therapist Online
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl">
            Connecting NRIs to top Indian therapists. Culturally tailored, affordable,
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
          <p className="text-sm text-gray-500 mb-5">
            {therapists.length === 0
              ? "No results"
              : `${therapists.length} therapist${therapists.length !== 1 ? "s" : ""} found`}
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
          ) : therapists.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No therapists found with these filters
              </h3>
              <p className="text-gray-500 mb-6 max-w-md">
                Try removing some filters or reach out to us on WhatsApp and
                we&apos;ll help you find the right match.
              </p>
              <a
                href="https://wa.me/18568782862"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1DA851] transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.12.553 4.106 1.522 5.832L.057 23.428a.75.75 0 00.921.921l5.596-1.465A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.718 9.718 0 01-4.976-1.366l-.356-.213-3.699.97.987-3.603-.233-.371A9.718 9.718 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
                </svg>
                Contact Us on WhatsApp
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {therapists.map((t) => (
                <TherapistCard key={t.id} therapist={t} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
