"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const COUNTRY_CODES = [
  { code: "+1", flag: "🇺🇸", name: "US" },
  { code: "+1", flag: "🇨🇦", name: "CA" },
  { code: "+44", flag: "🇬🇧", name: "GB" },
  { code: "+61", flag: "🇦🇺", name: "AU" },
  { code: "+64", flag: "🇳🇿", name: "NZ" },
  { code: "+971", flag: "🇦🇪", name: "AE" },
  { code: "+65", flag: "🇸🇬", name: "SG" },
  { code: "+60", flag: "🇲🇾", name: "MY" },
  { code: "+31", flag: "🇳🇱", name: "NL" },
  { code: "+49", flag: "🇩🇪", name: "DE" },
  { code: "+33", flag: "🇫🇷", name: "FR" },
  { code: "+91", flag: "🇮🇳", name: "IN" },
];

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia",
  "UAE", "Singapore", "New Zealand", "Netherlands", "Germany",
  "France", "Malaysia", "Sweden", "Norway", "Switzerland",
  "Ireland", "South Africa", "India", "Other",
];

// Timezone → country rough map
const TZ_COUNTRY: Record<string, string> = {
  "America/New_York": "United States",
  "America/Chicago": "United States",
  "America/Denver": "United States",
  "America/Los_Angeles": "United States",
  "America/Toronto": "Canada",
  "America/Vancouver": "Canada",
  "Europe/London": "United Kingdom",
  "Europe/Dublin": "Ireland",
  "Australia/Sydney": "Australia",
  "Australia/Melbourne": "Australia",
  "Pacific/Auckland": "New Zealand",
  "Asia/Dubai": "UAE",
  "Asia/Singapore": "Singapore",
  "Asia/Kuala_Lumpur": "Malaysia",
  "Europe/Amsterdam": "Netherlands",
  "Europe/Berlin": "Germany",
  "Europe/Paris": "France",
  "Europe/Stockholm": "Sweden",
  "Europe/Oslo": "Norway",
  "Europe/Zurich": "Switzerland",
  "Asia/Kolkata": "India",
};

const SUPPORT_TYPES = [
  { value: "individual", label: "Individual therapy", icon: "👤" },
  { value: "couples", label: "Couples therapy", icon: "💑" },
  { value: "family", label: "Family therapy", icon: "👨‍👩‍👧" },
  { value: "exploring", label: "Just exploring", icon: "🔍" },
];

const CONCERNS = [
  "Loneliness", "Relationship issues", "Visa/career anxiety",
  "Family pressure", "Depression", "Anxiety", "Grief",
  "Identity", "Marriage", "Other",
];

const URGENCY = [
  { value: "this_week", label: "This week" },
  { value: "next_month", label: "In the next month" },
  { value: "exploring", label: "Just exploring" },
];

const BUDGETS = [
  { value: "premium", label: "$97/session", sub: "Premium" },
  { value: "elite", label: "$144/session", sub: "Elite" },
  { value: "unsure", label: "Not sure yet", sub: "" },
];

const LANGUAGES = [
  "Hindi", "Tamil", "Telugu", "Gujarati", "Marathi",
  "Kannada", "Malayalam", "Punjabi", "English",
];

const TIME_SLOTS = [
  { value: "weekday_mornings", label: "Weekday mornings" },
  { value: "weekday_evenings", label: "Weekday evenings" },
  { value: "weekends", label: "Weekends" },
];

const STEPS = ["About You", "Your Needs", "Preferences", "Review"];
const STORAGE_KEY = "it_book_form";

// ─────────────────────────────────────────────────────────────
// Zod schema
// ─────────────────────────────────────────────────────────────

const schema = z.object({
  // Step 1
  full_name: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Please enter a valid email"),
  phone_code: z.string(),
  phone_number: z.string().min(5, "Please enter your phone number"),
  country: z.string().min(1, "Please select your country"),
  city: z.string().optional(),
  // Step 2
  support_type: z.string().min(1, "Please select one"),
  concerns: z.array(z.string()).min(1, "Please select at least one"),
  urgency: z.string().min(1, "Please select one"),
  budget: z.string().min(1, "Please select one"),
  // Step 3
  languages: z.array(z.string()).min(1, "Please select at least one language"),
  time_slots: z.array(z.string()).min(1, "Please select at least one time"),
  // Step 4
  agreed: z.literal(true, { message: "You must agree to continue" }),
});

type FormData = z.infer<typeof schema>;

// ─────────────────────────────────────────────────────────────
// Step field groups for per-step validation
// ─────────────────────────────────────────────────────────────

const STEP_FIELDS: (keyof FormData)[][] = [
  ["full_name", "email", "phone_code", "phone_number", "country"],
  ["support_type", "concerns", "urgency", "budget"],
  ["languages", "time_slots"],
  ["agreed"],
];

// ─────────────────────────────────────────────────────────────
// Matched therapist card (success screen)
// ─────────────────────────────────────────────────────────────

interface MatchedTherapist {
  id: string;
  full_name: string;
  slug: string;
  tier: string;
  session_rate_cents: number;
  specialties: string[];
  languages: string[];
  experience_years: number | null;
}

const FALLBACK_MATCHES: MatchedTherapist[] = [
  {
    id: "1", full_name: "Dr. Priya Sharma", slug: "dr-priya-sharma",
    tier: "premium", session_rate_cents: 9700,
    specialties: ["Anxiety", "Stress Management", "OCD"],
    languages: ["Hindi", "English"], experience_years: 10,
  },
  {
    id: "2", full_name: "Kavitha Rajan", slug: "kavitha-rajan",
    tier: "premium", session_rate_cents: 9700,
    specialties: ["Relationships", "Couples Therapy"],
    languages: ["Tamil", "English"], experience_years: 8,
  },
];

function MatchCard({ t }: { t: MatchedTherapist }) {
  const initials = t.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  return (
    <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm flex items-start gap-3">
      <div className="h-12 w-12 rounded-full bg-[#1B6B6B]/10 flex items-center justify-center shrink-0">
        <span className="text-sm font-semibold text-[#1B6B6B]">{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-semibold text-gray-900 text-sm">{t.full_name}</p>
          <span className="text-xs rounded-full bg-[#1B6B6B]/10 text-[#1B6B6B] px-2 py-0.5">{t.tier}</span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{t.specialties.slice(0, 2).join(" · ")}</p>
        <p className="text-xs text-gray-400 mt-0.5">🗣 {t.languages.join(" · ")}</p>
      </div>
      <Link
        href={`/therapists/${t.slug}`}
        className="shrink-0 rounded-full bg-[#1B6B6B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#134F4F] transition-colors"
      >
        View
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────

export default function BookPage() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [matches, setMatches] = useState<MatchedTherapist[]>([]);
  const [animating, setAnimating] = useState(false);
  const [animDir, setAnimDir] = useState<"forward" | "back">("forward");

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone_code: "+1",
      concerns: [],
      languages: [],
      time_slots: [],
      budget: "",
      support_type: "",
      urgency: "",
      country: "",
    },
  });

  // ── Detect country from timezone ──────────────────────────
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const detected = TZ_COUNTRY[tz];
    if (detected) setValue("country", detected);
  }, [setValue]);

  // ── Restore from sessionStorage ───────────────────────────
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        (Object.keys(parsed) as (keyof FormData)[]).forEach((key) => {
          setValue(key, parsed[key]);
        });
      }
    } catch { /* ignore */ }
  }, [setValue]);

  // ── Persist to sessionStorage on every change ─────────────
  const values = watch();
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    } catch { /* ignore */ }
  }, [values]);

  // ── Animated step transition ──────────────────────────────
  const transition = useCallback((newStep: number, dir: "forward" | "back") => {
    setAnimDir(dir);
    setAnimating(true);
    setTimeout(() => {
      setStep(newStep);
      setAnimating(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 200);
  }, []);

  const goNext = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) transition(step + 1, "forward");
  };

  const goBack = () => transition(step - 1, "back");

  // ── Submit ────────────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
      const phone = `${data.phone_code}${data.phone_number.replace(/\D/g, "")}`;

      const res = await fetch(`${apiUrl}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: data.full_name,
          email: data.email,
          phone,
          country: data.country,
          city: data.city || undefined,
          concern: data.concerns.join(", "),
          support_type: data.support_type,
          urgency: data.urgency,
          budget_preference: data.budget,
          preferred_languages: data.languages,
          preferred_times: data.time_slots,
          source: "book_form",
        }),
      });

      let matchData: MatchedTherapist[] = FALLBACK_MATCHES;
      if (res.ok) {
        const body = await res.json();
        if (body.matched_therapists?.length) matchData = body.matched_therapists;
      }

      setMatches(matchData);
      sessionStorage.removeItem(STORAGE_KEY);
      setSubmitted(true);
    } catch {
      setMatches(FALLBACK_MATCHES);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // Success screen
  // ─────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#FFF8F0] flex flex-col items-center justify-start py-16 px-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1
              className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              We&apos;re on it!
            </h1>
            <p className="text-gray-600 leading-relaxed">
              Check your WhatsApp — Priya will call you within a few minutes to
              learn more about what you need and match you with the right therapist.
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 mb-6">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="text-2xl">📱</span>
              <p>
                Keep your phone nearby. We&apos;ll reach out to{" "}
                <span className="font-medium text-gray-900">
                  {getValues("phone_code")}{getValues("phone_number")}
                </span>{" "}
                on WhatsApp.
              </p>
            </div>
          </div>

          {matches.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                While you wait — therapists who might be a great fit
              </p>
              <div className="space-y-3">
                {matches.map((t) => (
                  <MatchCard key={t.id} t={t} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/therapists"
              className="text-sm text-[#1B6B6B] hover:underline"
            >
              Browse all therapists →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────
  // Form steps
  // ─────────────────────────────────────────────────────────

  const animClass = animating
    ? animDir === "forward"
      ? "opacity-0 translate-x-4"
      : "opacity-0 -translate-x-4"
    : "opacity-100 translate-x-0";

  return (
    <main className="min-h-screen bg-[#FFF8F0] py-10 px-4">
      <div className="mx-auto max-w-xl">

        {/* Progress header */}
        <div className="mb-8">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 mb-4 inline-block">
            ← India Therapist
          </Link>
          <h1
            className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Find Your Therapist
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>

          {/* Progress bar */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  i <= step ? "bg-[#1B6B6B]" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step panel */}
        <div
          className={`transition-all duration-200 ${animClass}`}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">

              {/* ── STEP 1 ─ About You ───────────────────── */}
              {step === 0 && (
                <div className="space-y-5">
                  <StepHeading>Tell us about yourself</StepHeading>

                  <Field label="Full Name *" error={errors.full_name?.message}>
                    <input
                      {...register("full_name")}
                      placeholder="Your full name"
                      className={inputCls(!!errors.full_name)}
                    />
                  </Field>

                  <Field label="Email *" error={errors.email?.message}>
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="you@email.com"
                      className={inputCls(!!errors.email)}
                    />
                  </Field>

                  <Field label="WhatsApp / Phone *" error={errors.phone_number?.message}>
                    <div className="flex gap-2">
                      <Controller
                        name="phone_code"
                        control={control}
                        render={({ field }) => (
                          <select
                            {...field}
                            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B6B6B]/30 w-24 shrink-0"
                          >
                            {COUNTRY_CODES.map((c) => (
                              <option key={`${c.flag}${c.code}`} value={c.code}>
                                {c.flag} {c.code}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                      <input
                        {...register("phone_number")}
                        type="tel"
                        placeholder="555 000 0000"
                        className={`flex-1 ${inputCls(!!errors.phone_number)}`}
                      />
                    </div>
                  </Field>

                  <Field label="Country *" error={errors.country?.message}>
                    <Controller
                      name="country"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className={`w-full ${inputCls(!!errors.country)} bg-white`}
                        >
                          <option value="">Select your country</option>
                          {COUNTRIES.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      )}
                    />
                  </Field>

                  <Field label="City" error={undefined}>
                    <input
                      {...register("city")}
                      placeholder="e.g. San Francisco"
                      className={inputCls(false)}
                    />
                  </Field>
                </div>
              )}

              {/* ── STEP 2 ─ Your Needs ─────────────────── */}
              {step === 1 && (
                <div className="space-y-7">
                  <StepHeading>What are you looking for?</StepHeading>

                  {/* Support type */}
                  <Field label="What kind of support are you looking for? *" error={errors.support_type?.message}>
                    <Controller
                      name="support_type"
                      control={control}
                      render={({ field }) => (
                        <div className="grid grid-cols-2 gap-3">
                          {SUPPORT_TYPES.map((o) => (
                            <button
                              key={o.value}
                              type="button"
                              onClick={() => field.onChange(o.value)}
                              className={`rounded-xl border-2 p-3 text-left transition-all ${
                                field.value === o.value
                                  ? "border-[#1B6B6B] bg-[#1B6B6B]/5"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="text-xl mb-1">{o.icon}</div>
                              <p className="text-sm font-medium text-gray-800">{o.label}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    />
                  </Field>

                  {/* Concerns */}
                  <Field label="What's been on your mind? *" error={errors.concerns?.message}>
                    <Controller
                      name="concerns"
                      control={control}
                      render={({ field }) => (
                        <div className="flex flex-wrap gap-2">
                          {CONCERNS.map((c) => {
                            const active = field.value.includes(c);
                            return (
                              <button
                                key={c}
                                type="button"
                                onClick={() =>
                                  field.onChange(
                                    active
                                      ? field.value.filter((x) => x !== c)
                                      : [...field.value, c]
                                  )
                                }
                                className={`rounded-full px-3 py-1.5 text-sm font-medium border transition-all ${
                                  active
                                    ? "bg-[#1B6B6B] text-white border-[#1B6B6B]"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-[#1B6B6B]"
                                }`}
                              >
                                {c}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    />
                  </Field>

                  {/* Urgency */}
                  <Field label="How soon would you like to start? *" error={errors.urgency?.message}>
                    <Controller
                      name="urgency"
                      control={control}
                      render={({ field }) => (
                        <div className="space-y-2">
                          {URGENCY.map((o) => (
                            <label
                              key={o.value}
                              className={`flex items-center gap-3 rounded-xl border-2 p-3 cursor-pointer transition-all ${
                                field.value === o.value
                                  ? "border-[#1B6B6B] bg-[#1B6B6B]/5"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <input
                                type="radio"
                                name="urgency"
                                value={o.value}
                                checked={field.value === o.value}
                                onChange={() => field.onChange(o.value)}
                                className="accent-[#1B6B6B]"
                              />
                              <span className="text-sm font-medium text-gray-800">{o.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    />
                  </Field>

                  {/* Budget */}
                  <Field label="What's your budget? *" error={errors.budget?.message}>
                    <Controller
                      name="budget"
                      control={control}
                      render={({ field }) => (
                        <div className="space-y-2">
                          {BUDGETS.map((o) => (
                            <label
                              key={o.value}
                              className={`flex items-center justify-between rounded-xl border-2 p-3 cursor-pointer transition-all ${
                                field.value === o.value
                                  ? "border-[#1B6B6B] bg-[#1B6B6B]/5"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="budget"
                                  value={o.value}
                                  checked={field.value === o.value}
                                  onChange={() => field.onChange(o.value)}
                                  className="accent-[#1B6B6B]"
                                />
                                <span className="text-sm font-medium text-gray-800">{o.label}</span>
                              </div>
                              {o.sub && (
                                <span className="text-xs text-gray-400">{o.sub}</span>
                              )}
                            </label>
                          ))}
                        </div>
                      )}
                    />
                  </Field>
                </div>
              )}

              {/* ── STEP 3 ─ Preferences ────────────────── */}
              {step === 2 && (
                <div className="space-y-7">
                  <StepHeading>Your preferences</StepHeading>

                  {/* Language */}
                  <Field label="Which language(s) would you prefer? *" error={errors.languages?.message}>
                    <Controller
                      name="languages"
                      control={control}
                      render={({ field }) => (
                        <div className="flex flex-wrap gap-2">
                          {LANGUAGES.map((lang) => {
                            const active = field.value.includes(lang);
                            return (
                              <button
                                key={lang}
                                type="button"
                                onClick={() =>
                                  field.onChange(
                                    active
                                      ? field.value.filter((x) => x !== lang)
                                      : [...field.value, lang]
                                  )
                                }
                                className={`rounded-full px-3 py-1.5 text-sm font-medium border transition-all ${
                                  active
                                    ? "bg-[#1B6B6B] text-white border-[#1B6B6B]"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-[#1B6B6B]"
                                }`}
                              >
                                {lang}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    />
                  </Field>

                  {/* Time slots */}
                  <Field label="What times work for you? *" error={errors.time_slots?.message}>
                    <Controller
                      name="time_slots"
                      control={control}
                      render={({ field }) => (
                        <div className="space-y-2">
                          {TIME_SLOTS.map((o) => {
                            const active = field.value.includes(o.value);
                            return (
                              <label
                                key={o.value}
                                className={`flex items-center gap-3 rounded-xl border-2 p-3 cursor-pointer transition-all ${
                                  active
                                    ? "border-[#1B6B6B] bg-[#1B6B6B]/5"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={active}
                                  onChange={() =>
                                    field.onChange(
                                      active
                                        ? field.value.filter((x) => x !== o.value)
                                        : [...field.value, o.value]
                                    )
                                  }
                                  className="accent-[#1B6B6B] h-4 w-4"
                                />
                                <span className="text-sm font-medium text-gray-800">{o.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    />
                  </Field>
                </div>
              )}

              {/* ── STEP 4 ─ Review + Submit ─────────────── */}
              {step === 3 && (
                <div className="space-y-6">
                  <StepHeading>Review your details</StepHeading>

                  {/* Summary */}
                  <div className="space-y-3">
                    <SummaryRow label="Name" value={watch("full_name")} />
                    <SummaryRow label="Email" value={watch("email")} />
                    <SummaryRow
                      label="Phone"
                      value={`${watch("phone_code")} ${watch("phone_number")}`}
                    />
                    <SummaryRow label="Country" value={watch("country")} />
                    {watch("city") && <SummaryRow label="City" value={watch("city")!} />}
                    <SummaryRow
                      label="Looking for"
                      value={SUPPORT_TYPES.find((t) => t.value === watch("support_type"))?.label ?? ""}
                    />
                    <SummaryRow label="Concerns" value={watch("concerns").join(", ")} />
                    <SummaryRow
                      label="Start"
                      value={URGENCY.find((u) => u.value === watch("urgency"))?.label ?? ""}
                    />
                    <SummaryRow
                      label="Budget"
                      value={BUDGETS.find((b) => b.value === watch("budget"))?.label ?? ""}
                    />
                    <SummaryRow label="Languages" value={watch("languages").join(", ")} />
                    <SummaryRow
                      label="Available"
                      value={watch("time_slots")
                        .map((v) => TIME_SLOTS.find((t) => t.value === v)?.label ?? v)
                        .join(", ")}
                    />
                  </div>

                  {/* Disclaimer checkbox */}
                  <div className="border-t border-gray-100 pt-5">
                    <Controller
                      name="agreed"
                      control={control}
                      render={({ field }) => (
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.value === true}
                            onChange={(e) =>
                              field.onChange(e.target.checked ? true : undefined)
                            }
                            className="accent-[#1B6B6B] h-4 w-4 mt-0.5 shrink-0"
                          />
                          <span className="text-sm text-gray-600 leading-relaxed">
                            I agree that this platform connects me with therapists and is{" "}
                            <strong>not a crisis service</strong>. For emergencies, please
                            call your local emergency number.
                          </span>
                        </label>
                      )}
                    />
                    {errors.agreed && (
                      <p className="text-xs text-red-600 mt-1.5 ml-7">{errors.agreed.message}</p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-full bg-[#1B6B6B] px-6 py-3.5 text-base font-semibold text-white hover:bg-[#134F4F] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Finding your perfect match…
                      </span>
                    ) : (
                      "Find My Therapist →"
                    )}
                  </button>

                  <p className="text-center text-xs text-gray-400">
                    🔒 Your information is private and secure
                  </p>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-5">
              {step > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex-1 rounded-full border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-colors"
                >
                  ← Back
                </button>
              )}
              {step < STEPS.length - 1 && (
                <button
                  type="button"
                  onClick={goNext}
                  className="flex-1 rounded-full bg-[#1B6B6B] px-6 py-3 text-sm font-semibold text-white hover:bg-[#134F4F] transition-colors"
                >
                  Continue →
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────

function StepHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xl font-bold text-gray-900 mb-1"
      style={{ fontFamily: "var(--font-playfair)" }}
    >
      {children}
    </h2>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-24 shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-gray-800 flex-1">{value}</span>
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full rounded-xl border ${
    hasError ? "border-red-300 ring-1 ring-red-300" : "border-gray-200"
  } px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B6B6B]/30`;
}
