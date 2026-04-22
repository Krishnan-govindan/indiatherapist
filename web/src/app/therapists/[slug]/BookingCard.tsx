"use client";

import { useState } from "react";

interface BookingCardProps {
  therapistName: string;
  therapistSlug: string;
  sessionRateCents: number;
  waNumber?: string | null;
}

interface FormState {
  full_name: string;
  email: string;
  phone: string;
  concern: string;
}

const INITIAL_FORM: FormState = {
  full_name: "",
  email: "",
  phone: "",
  concern: "",
};

export default function BookingCard({
  therapistName,
  therapistSlug,
  sessionRateCents,
  waNumber,
}: BookingCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rate = (sessionRateCents / 100).toFixed(0);
  const waMsg = encodeURIComponent(
    `Hi, I would like to connect with ${therapistName}`
  );
  const waLink = `https://wa.me/14254424167?text=${waMsg}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

      const res = await fetch(`${apiUrl}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email || undefined,
          phone: form.phone,
          concern: form.concern || undefined,
          therapist_slug: therapistSlug,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }

      const data = await res.json();

      if (data.checkout_url) {
        // Redirect directly to Stripe Checkout
        window.location.href = data.checkout_url;
      } else {
        // Fallback to WhatsApp if Stripe isn't configured
        setPaymentUrl(waLink);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-lg p-6">
      {/* Rate */}
      <div className="mb-5">
        <span className="text-3xl font-bold text-gray-900">${rate}</span>
        <span className="text-gray-500 text-sm ml-1">/ 60-min session</span>
      </div>

      {/* Trust badges */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>✅</span>
          <span>Risk-free: Full refund if unsatisfied</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>🔒</span>
          <span>Secure payment via Stripe</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>🎥</span>
          <span>Video session — attend from anywhere</span>
        </div>
      </div>

      {/* Payment success state */}
      {paymentUrl ? (
        <div className="text-center">
          <div className="text-4xl mb-3">🎉</div>
          <p className="font-semibold text-gray-900 mb-1">You&apos;re all set!</p>
          <p className="text-sm text-gray-500 mb-5">
            Complete your payment to confirm the session.
          </p>
          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-full bg-[#7B5FB8] px-6 py-3 text-center text-sm font-semibold text-white hover:bg-[#6B4AA0] transition-colors"
          >
            Complete Payment →
          </a>
        </div>
      ) : showForm ? (
        /* Inline booking form */
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
              Full Name *
            </label>
            <input
              required
              type="text"
              value={form.full_name}
              onChange={updateField("full_name")}
              placeholder="Your full name"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B5FB8]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={updateField("email")}
              placeholder="your@email.com"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B5FB8]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
              WhatsApp / Phone *
            </label>
            <input
              required
              type="tel"
              value={form.phone}
              onChange={updateField("phone")}
              placeholder="+1 555 000 0000"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B5FB8]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
              What brings you here?
            </label>
            <textarea
              rows={3}
              value={form.concern}
              onChange={updateField("concern")}
              placeholder="Briefly describe what you'd like to work on…"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B5FB8]/30 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[#7B5FB8] px-6 py-3 text-sm font-semibold text-white hover:bg-[#6B4AA0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting…" : "Continue to Payment →"}
          </button>

          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Cancel
          </button>
        </form>
      ) : (
        /* Default CTA buttons */
        <div className="space-y-3">
          <button
            onClick={() => setShowForm(true)}
            className="w-full rounded-full bg-[#7B5FB8] px-6 py-3 text-sm font-semibold text-white hover:bg-[#6B4AA0] transition-colors"
          >
            Book a Session
          </button>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-full border-2 border-[#25D366] px-6 py-3 text-sm font-semibold text-[#1A8F46] hover:bg-[#25D366] hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.12.553 4.106 1.522 5.832L.057 23.428a.75.75 0 00.921.921l5.596-1.465A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.718 9.718 0 01-4.976-1.366l-.356-.213-3.699.97.987-3.603-.233-.371A9.718 9.718 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
            </svg>
            Message on WhatsApp first
          </a>
        </div>
      )}
    </div>
  );
}
