/**
 * Analytics event tracking utility for India Therapist.
 *
 * Usage (in client components):
 *   import { trackEvent } from "@/lib/analytics";
 *   trackEvent("whatsapp_click", { location: "navbar" });
 *
 * Set NEXT_PUBLIC_GA_ID in your environment variables to activate GA4.
 *
 * Key events to track:
 *   - whatsapp_click    : WhatsApp button clicked (any location)
 *   - book_click        : "Book Now" or "Book a Session" clicked
 *   - therapist_view    : Therapist profile page loaded
 *   - form_submit       : Intake/booking form submitted
 *   - payment_complete  : Stripe payment confirmed (conversion)
 */

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { gtag?: (...args: any[]) => void; }
}

type GaEvent =
  | "whatsapp_click"
  | "book_click"
  | "therapist_view"
  | "form_submit"
  | "payment_complete"
  | string;

/**
 * Send a GA4 event. Safe to call server-side (no-ops silently).
 */
export function trackEvent(
  event: GaEvent,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", event, params);
}

/**
 * Pre-built event helpers for the most common interactions.
 */
export const events = {
  whatsappClick: (location: string) =>
    trackEvent("whatsapp_click", { event_category: "engagement", location }),

  bookClick: (therapistSlug?: string) =>
    trackEvent("book_click", {
      event_category: "conversion",
      ...(therapistSlug && { therapist: therapistSlug }),
    }),

  therapistView: (slug: string, name: string) =>
    trackEvent("therapist_view", {
      event_category: "engagement",
      therapist_slug: slug,
      therapist_name: name,
    }),

  formSubmit: (formName: string) =>
    trackEvent("form_submit", { event_category: "conversion", form: formName }),

  paymentComplete: (amountCents: number, therapistSlug?: string) =>
    trackEvent("payment_complete", {
      event_category: "conversion",
      currency: "USD",
      value: amountCents / 100,
      ...(therapistSlug && { therapist: therapistSlug }),
    }),
};
