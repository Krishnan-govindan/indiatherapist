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
// Skeleton card — warm tones
// ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-3xl bg-white/80 border border-[#f5e6d8] p-6 shadow-sm animate-pulse">
      <div className="h-[5px] w-full rounded-t-3xl bg-gradient-to-r from-[#f5e6d8] via-[#fce4c9] to-[#f5e6d8] mb-4" />
      <div className="flex flex-col items-center mb-4">
        <div className="h-[130px] w-[130px] rounded-full bg-[#f5e6d8] mb-3" />
        <div className="h-5 bg-[#f5e6d8] rounded w-3/4 mb-2" />
        <div className="h-4 bg-[#f5e6d8] rounded w-1/2 mb-2" />
        <div className="h-6 bg-[#f5e6d8] rounded-full w-20" />
      </div>
      <div className="flex gap-2 justify-center mb-3">
        <div className="h-5 bg-[#f5e6d8] rounded-full w-16" />
        <div className="h-5 bg-[#f5e6d8] rounded-full w-20" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-[#f5e6d8] rounded w-full" />
        <div className="h-3 bg-[#f5e6d8] rounded w-5/6" />
      </div>
      <div className="flex gap-3 mt-auto pt-2">
        <div className="h-10 bg-[#f5e6d8] rounded-full flex-1" />
        <div className="h-10 bg-[#f5e6d8] rounded-full flex-1" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Avatar initials
// ─────────────────────────────────────────────────────────────

function AvatarInitials({ name, tier }: { name: string; tier: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  const isElite = tier === "elite";

  return (
    <div
      className={`h-[130px] w-[130px] rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-[1.08] group-hover:rotate-[3deg] ${
        isElite
          ? "bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] border-4 border-[#c9b037]"
          : "bg-gradient-to-br from-[#16a085]/10 to-[#16a085]/20 border-4 border-[#16a085]/30"
      }`}
      style={
        isElite
          ? { boxShadow: "0 0 20px rgba(201,176,55,0.3)" }
          : {}
      }
    >
      <span
        className={`text-3xl font-bold ${
          isElite ? "text-[#c9b037]" : "text-[#16a085]"
        }`}
      >
        {initials}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Therapist card — tier-based luxury design
// ─────────────────────────────────────────────────────────────

function TherapistCard({ therapist, index }: { therapist: Therapist; index: number }) {
  const rate = (therapist.session_rate_cents / 100).toFixed(0);
  const isElite = therapist.tier === "elite";
  const isPremium = therapist.tier === "premium";

  // Card wrapper classes by tier
  const cardClasses = isElite
    ? "group rounded-3xl bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] p-6 flex flex-col relative overflow-hidden"
    : isPremium
    ? "group rounded-3xl bg-gradient-to-br from-[#fff9c4] to-white p-6 flex flex-col relative overflow-hidden"
    : "group rounded-3xl bg-white p-6 flex flex-col relative overflow-hidden";

  const borderStyle = isElite
    ? { border: "3px solid #c9b037" }
    : isPremium
    ? { border: "2px solid #c9b037" }
    : { border: "2px solid #e8ddd4" };

  const hoverShadow = isElite
    ? "0 25px 60px rgba(201,176,55,0.35)"
    : isPremium
    ? "0 20px 50px rgba(201,176,55,0.2)"
    : "0 20px 40px rgba(22,160,133,0.15)";

  const hoverTransform = isElite
    ? "translateY(-20px) scale(1.03)"
    : isPremium
    ? "translateY(-15px) scale(1.02)"
    : "translateY(-12px) scale(1.02)";

  // Shimmer color
  const shimmerGradient = isElite
    ? "linear-gradient(90deg, transparent 0%, #ffd700 25%, #c9b037 50%, #ffd700 75%, transparent 100%)"
    : isPremium
    ? "linear-gradient(90deg, transparent 0%, #ffd700 25%, #e6c84b 50%, #ffd700 75%, transparent 100%)"
    : "linear-gradient(90deg, transparent 0%, #16a085 25%, #1abc9c 50%, #16a085 75%, transparent 100%)";

  // Text colors
  const nameColor = isElite ? "text-[#ffd700]" : "text-gray-900";
  const labelColor = isElite ? "text-[#c9b037]" : "text-gray-500";
  const valueColor = isElite ? "text-white" : "text-gray-700";
  const bioColor = isElite ? "text-gray-400" : "text-gray-500";

  return (
    <div
      className={cardClasses}
      style={{
        ...borderStyle,
        animation: `fadeInCard 0.5s ease-out ${index * 0.08}s both`,
        transition: "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = hoverTransform;
        e.currentTarget.style.boxShadow = hoverShadow;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Shimmer bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[5px] rounded-t-3xl"
        style={{
          background: shimmerGradient,
          backgroundSize: "200% 100%",
          animation: "shimmer 3s ease-in-out infinite",
        }}
      />

      {/* Photo / Avatar */}
      <div className="flex justify-center mb-4 mt-2">
        {therapist.photo_url ? (
          <div
            className={`relative rounded-full overflow-hidden transition-transform duration-300 group-hover:scale-[1.08] group-hover:rotate-[3deg] ${
              isElite ? "ring-4 ring-[#c9b037]" : isPremium ? "ring-4 ring-[#c9b037]/50" : "ring-4 ring-[#16a085]/30"
            }`}
            style={
              isElite
                ? { boxShadow: "0 0 25px rgba(201,176,55,0.4)" }
                : {}
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={therapist.photo_url}
              alt={therapist.full_name}
              className="h-[130px] w-[130px] rounded-full object-cover"
            />
          </div>
        ) : (
          <AvatarInitials name={therapist.full_name} tier={therapist.tier} />
        )}
      </div>

      {/* Name + verified */}
      <div className="flex items-center justify-center gap-2 mb-1">
        <h3
          className={`font-bold text-lg leading-tight text-center ${nameColor}`}
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          {therapist.full_name}
        </h3>
        <span
          title="Verified therapist"
          className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-white text-[10px] shrink-0 ${
            isElite ? "bg-[#c9b037]" : "bg-[#16a085]"
          }`}
        >
          ✓
        </span>
      </div>

      {/* Experience */}
      {therapist.experience_years && (
        <p className={`text-sm text-center mb-1 ${labelColor}`}>
          <span className={`font-semibold ${valueColor}`}>
            {therapist.experience_years}
          </span>{" "}
          years experience
        </p>
      )}

      {/* Tier badge */}
      <div className="flex justify-center mb-3">
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
            isElite
              ? "bg-gradient-to-r from-[#c9b037] to-[#ffd700] text-[#1a1a1a]"
              : isPremium
              ? "bg-amber-100 text-amber-800 border border-amber-300"
              : "bg-[#16a085]/10 text-[#16a085] border border-[#16a085]/30"
          }`}
        >
          {therapist.tier}
        </span>
      </div>

      {/* Specialty tags */}
      <div className="flex flex-wrap gap-1.5 justify-center mb-3">
        {therapist.specialties.slice(0, 3).map((s) => (
          <span
            key={s}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isElite
                ? "bg-[#c9b037]/15 text-[#ffd700] border border-[#c9b037]/30"
                : isPremium
                ? "bg-amber-100/60 text-amber-700 border border-amber-200"
                : "bg-[#16a085]/10 text-[#16a085] border border-[#16a085]/20"
            }`}
          >
            {s}
          </span>
        ))}
      </div>

      {/* Language badges */}
      <div className="flex flex-wrap gap-1.5 justify-center mb-3">
        {therapist.languages.map((lang) => (
          <span
            key={lang}
            className={`rounded-full px-2.5 py-0.5 text-xs ${
              isElite
                ? "bg-white/10 text-gray-300 border border-white/10"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {lang}
          </span>
        ))}
      </div>

      {/* Bio excerpt */}
      {therapist.bio && (
        <p className={`text-sm line-clamp-2 mb-4 flex-1 text-center ${bioColor}`}>
          {therapist.bio}
        </p>
      )}

      {/* Rate + CTAs */}
      <div className="mt-auto">
        <p
          className={`text-xl font-bold text-center mb-4 ${
            isElite ? "text-[#ffd700]" : "text-gray-900"
          }`}
        >
          ${rate}
          <span
            className={`text-sm font-normal ml-1 ${
              isElite ? "text-gray-400" : "text-gray-400"
            }`}
          >
            /session
          </span>
        </p>
        <div className="flex gap-3">
          <Link
            href={`/therapists/${therapist.slug}`}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold text-center transition-all duration-300 ${
              isElite
                ? "border-2 border-[#c9b037] text-[#c9b037] hover:bg-[#c9b037] hover:text-[#1a1a1a]"
                : isPremium
                ? "border-2 border-[#16a085] text-[#16a085] hover:bg-[#16a085] hover:text-white"
                : "border-2 border-[#16a085] text-[#16a085] hover:bg-[#16a085] hover:text-white"
            }`}
          >
            View Profile
          </Link>
          <Link
            href={`/book?therapist=${therapist.slug}`}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-bold text-center transition-all duration-300 ${
              isElite
                ? "bg-gradient-to-r from-[#c9b037] to-[#ffd700] text-[#1a1a1a] hover:from-[#ffd700] hover:to-[#c9b037] shadow-lg shadow-[#c9b037]/20"
                : "bg-gradient-to-r from-[#16a085] to-[#1abc9c] text-white hover:from-[#1abc9c] hover:to-[#16a085] shadow-lg shadow-[#16a085]/20"
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
// Filter bar — warm styling with green accents
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
    <div
      className="rounded-3xl shadow-md mb-8 border border-[#e8ddd4]"
      style={{
        background: "linear-gradient(135deg, #fff8f2 0%, #ffffff 100%)",
      }}
    >
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
            <span className="ml-1 rounded-full bg-[#16a085] text-white text-xs px-1.5 py-0.5">
              {activeCount}
            </span>
          )}
        </button>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-full border border-[#e8ddd4] px-4 py-1.5 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-[#16a085]/30 bg-white/80"
          />
        </div>
      </div>

      {/* Desktop layout / mobile expanded */}
      <div
        className={`${
          mobileOpen ? "block" : "hidden"
        } sm:block p-4 sm:p-5 border-t border-[#e8ddd4] sm:border-0`}
      >
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Search — desktop only */}
          <div className="hidden sm:block flex-1 min-w-0">
            <label className="block text-xs font-medium text-[#16a085] mb-1.5 uppercase tracking-wide">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#e8ddd4] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a085]/30 bg-white/80"
            />
          </div>

          {/* Language */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-[#16a085] mb-1.5 uppercase tracking-wide">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-xl border border-[#e8ddd4] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a085]/30 bg-white/80"
            >
              {LANGUAGES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-[#16a085] mb-1.5 uppercase tracking-wide">
              Sort by
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="w-full rounded-xl border border-[#e8ddd4] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a085]/30 bg-white/80"
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
            <label className="block text-xs font-medium text-[#16a085] mb-1.5 uppercase tracking-wide">
              Tier
            </label>
            <div className="flex rounded-xl border border-[#e8ddd4] overflow-hidden">
              {TIER_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setTier(o.value)}
                  className={`px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    tier === o.value
                      ? "bg-[#16a085] text-white"
                      : "bg-white/80 text-gray-600 hover:bg-[#16a085]/10"
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
          <label className="block text-xs font-medium text-[#16a085] mb-2 uppercase tracking-wide">
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
                      ? "bg-[#16a085] text-white border-[#16a085]"
                      : "bg-white/80 text-gray-600 border-[#e8ddd4] hover:border-[#16a085] hover:text-[#16a085]"
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

export default function TherapistPageClone() {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
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

  const itemListSchema = getItemListSchema(ALL_THERAPISTS);

  return (
    <main
      className="min-h-screen"
      style={{
        background: "linear-gradient(135deg, #fad9c5 0%, #ffffff 100%)",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Shimmer + fadeIn animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fadeInCard {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* Header — warm gradient with green text */}
      <div
        className="border-b border-[#e8ddd4]"
        style={{
          background: "linear-gradient(135deg, #fad9c5 0%, #fff5ee 50%, #ffffff 100%)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <h1
            className="text-3xl sm:text-5xl font-extrabold mb-4 bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, #16a085 0%, #0d6b58 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Find Your Perfect Indian Therapist Online
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl leading-relaxed">
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
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
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
                href="https://wa.me/14254424167"
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
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {therapists.map((t, i) => (
                <TherapistCard key={t.id} therapist={t} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
