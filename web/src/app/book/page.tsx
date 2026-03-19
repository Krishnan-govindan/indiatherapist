"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useForm, Controller } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ALL_THERAPISTS } from "@/data/therapists";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const COUNTRY_CODES = [
  { code: "+1", flag: "\u{1F1FA}\u{1F1F8}", name: "US" },
  { code: "+1", flag: "\u{1F1E8}\u{1F1E6}", name: "CA" },
  { code: "+44", flag: "\u{1F1EC}\u{1F1E7}", name: "GB" },
  { code: "+61", flag: "\u{1F1E6}\u{1F1FA}", name: "AU" },
  { code: "+64", flag: "\u{1F1F3}\u{1F1FF}", name: "NZ" },
  { code: "+971", flag: "\u{1F1E6}\u{1F1EA}", name: "AE" },
  { code: "+65", flag: "\u{1F1F8}\u{1F1EC}", name: "SG" },
  { code: "+60", flag: "\u{1F1F2}\u{1F1FE}", name: "MY" },
  { code: "+31", flag: "\u{1F1F3}\u{1F1F1}", name: "NL" },
  { code: "+49", flag: "\u{1F1E9}\u{1F1EA}", name: "DE" },
  { code: "+33", flag: "\u{1F1EB}\u{1F1F7}", name: "FR" },
  { code: "+91", flag: "\u{1F1EE}\u{1F1F3}", name: "IN" },
];

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia",
  "UAE", "Singapore", "New Zealand", "Netherlands", "Germany",
  "France", "Malaysia", "Sweden", "Norway", "Switzerland",
  "Ireland", "South Africa", "India", "Other",
];

// Timezone -> country rough map
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
  { value: "individual", label: "Individual therapy", icon: "\u{1F464}" },
  { value: "couples", label: "Couples therapy", icon: "\u{1F491}" },
];

const CONCERNS = [
  "Loneliness", "Relationship issues", "Visa/career anxiety",
  "Family pressure", "Depression", "Anxiety", "Grief",
  "Identity", "Marriage", "Other",
];

const STEPS = ["About You", "Your Needs", "Review"];
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
  // Step 2
  support_type: z.string().min(1, "Please select one"),
  concerns: z.array(z.string()).min(1, "Please select at least one"),
  // Step 3 (Review)
  agreed: z.literal(true, { message: "You must agree to continue" }),
});

type FormData = z.infer<typeof schema>;

// ─────────────────────────────────────────────────────────────
// Step field groups for per-step validation
// ─────────────────────────────────────────────────────────────

const STEP_FIELDS: (keyof FormData)[][] = [
  ["full_name", "email", "phone_code", "phone_number", "country"],
  ["support_type", "concerns"],
  ["agreed"],
];

// ─────────────────────────────────────────────────────────────
// Main page (wrapped in Suspense for useSearchParams)
// ─────────────────────────────────────────────────────────────

function BookForm() {
  const searchParams = useSearchParams();
  const therapistSlug = searchParams.get("therapist");
  const therapistData = therapistSlug
    ? ALL_THERAPISTS.find((t) => t.slug === therapistSlug)
    : null;
  const therapistName = therapistData?.full_name ?? null;

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [animDir, setAnimDir] = useState<"forward" | "back">("forward");

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone_code: "+1",
      concerns: [],
      support_type: "",
      country: "",
    },
  });

  // -- Detect country from timezone
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const detected = TZ_COUNTRY[tz];
    if (detected) setValue("country", detected);
  }, [setValue]);

  // -- Restore from sessionStorage
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

  // -- Persist to sessionStorage on every change
  const values = watch();
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    } catch { /* ignore */ }
  }, [values]);

  // -- Animated step transition
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

  // -- Submit: save to DB, then redirect to WhatsApp
  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
      const phone = `${data.phone_code}${data.phone_number.replace(/\D/g, "")}`;

      // Save to database
      await fetch(`${apiUrl}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: data.full_name,
          email: data.email,
          phone,
          country: data.country,
          concern: data.concerns.join(", "),
          support_type: data.support_type,
          preferred_therapist_slug: therapistSlug || undefined,
          source: "book_form",
        }),
      });

      sessionStorage.removeItem(STORAGE_KEY);

      // Build WhatsApp message with all details
      const supportLabel =
        SUPPORT_TYPES.find((t) => t.value === data.support_type)?.label ?? data.support_type;

      const buildLines = (phone: string) => {
        const greeting = therapistName
          ? `Hi I'd like to connect with ${therapistName}. can you help me out?`
          : `Hi, I'd like to book a session.`;
        return [
          greeting,
          ``,
          `*Name:* ${data.full_name}`,
          `*Email:* ${data.email}`,
          `*Phone:* ${phone}`,
          `*Country:* ${data.country}`,
          `*Looking for:* ${supportLabel}`,
          `*Concerns:* ${data.concerns.join(", ")}`,
        ];
      };

      const waMsg = encodeURIComponent(buildLines(`${data.phone_code} ${data.phone_number}`).join("\n"));
      window.location.href = `https://wa.me/18568782862?text=${waMsg}`;
    } catch {
      // Even if API fails, still redirect to WhatsApp
      const phone = `${data.phone_code}${data.phone_number.replace(/\D/g, "")}`;
      const supportLabel =
        SUPPORT_TYPES.find((t) => t.value === data.support_type)?.label ?? data.support_type;

      const greeting = therapistName
        ? `Hi I'd like to connect with ${therapistName}. can you help me out?`
        : `Hi, I'd like to book a session.`;
      const lines = [
        greeting,
        ``,
        `*Name:* ${data.full_name}`,
        `*Email:* ${data.email}`,
        `*Phone:* ${phone}`,
        `*Country:* ${data.country}`,
        `*Looking for:* ${supportLabel}`,
        `*Concerns:* ${data.concerns.join(", ")}`,
      ];

      const waMsg = encodeURIComponent(lines.join("\n"));
      window.location.href = `https://wa.me/18568782862?text=${waMsg}`;
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // Form steps
  // ─────────────────────────────────────────────────────────

  const animClass = animating
    ? animDir === "forward"
      ? "opacity-0 translate-x-4"
      : "opacity-0 -translate-x-4"
    : "opacity-100 translate-x-0";

  return (
    <main className="min-h-screen bg-[#F8F5FF] py-10 px-4">
      <div className="mx-auto max-w-xl">

        {/* Progress header */}
        <div className="mb-8">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 mb-4 inline-block">
            &larr; India Therapist
          </Link>
          <h1
            className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Book Your Session
            {therapistName && (
              <span className="block text-lg font-medium text-[#7B5FB8] mt-1">
                with {therapistName}
              </span>
            )}
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            Step {step + 1} of {STEPS.length} &mdash; {STEPS[step]}
          </p>

          {/* Progress bar */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  i <= step ? "bg-[#7B5FB8]" : "bg-gray-200"
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

              {/* -- STEP 1: About You */}
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
                            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#7B5FB8]/30 w-24 shrink-0"
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
                </div>
              )}

              {/* -- STEP 2: Your Needs */}
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
                                  ? "border-[#7B5FB8] bg-[#7B5FB8]/5"
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
                                    ? "bg-[#7B5FB8] text-white border-[#7B5FB8]"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-[#7B5FB8]"
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
                </div>
              )}

              {/* -- STEP 3: Review + Submit */}
              {step === 2 && (
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
                    <SummaryRow
                      label="Looking for"
                      value={SUPPORT_TYPES.find((t) => t.value === watch("support_type"))?.label ?? ""}
                    />
                    <SummaryRow label="Concerns" value={watch("concerns").join(", ")} />
                    {therapistName && (
                      <SummaryRow label="Therapist" value={therapistName} />
                    )}
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
                            className="accent-[#7B5FB8] h-4 w-4 mt-0.5 shrink-0"
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
                    className="flex items-center justify-center gap-2 w-full rounded-full bg-[#25D366] px-6 py-3.5 text-base font-semibold text-white hover:bg-[#1ebe5d] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current shrink-0">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.12.553 4.106 1.522 5.832L.057 23.428a.75.75 0 00.921.921l5.596-1.465A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.718 9.718 0 01-4.976-1.366l-.356-.213-3.699.97.987-3.603-.233-.371A9.718 9.718 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
                        </svg>
                        Submit &amp; Book via WhatsApp
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-gray-400">
                    Your information is private and secure
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
                  &larr; Back
                </button>
              )}
              {step < STEPS.length - 1 && (
                <button
                  type="button"
                  onClick={goNext}
                  className="flex-1 rounded-full bg-[#7B5FB8] px-6 py-3 text-sm font-semibold text-white hover:bg-[#6B4AA0] transition-colors"
                >
                  Continue &rarr;
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function BookPage() {
  return (
    <Suspense>
      <BookForm />
    </Suspense>
  );
}

// ─────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────

function StepHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xl font-bold text-gray-900 mb-1"
      style={{ fontFamily: "'Outfit', sans-serif" }}
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
  } px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B5FB8]/30`;
}
