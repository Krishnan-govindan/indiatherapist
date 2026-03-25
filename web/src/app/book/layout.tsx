import type { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.indiatherapist.com";

export const metadata: Metadata = {
  title: "Book Your Session — Find an Indian Therapist for NRIs | India Therapist",
  description:
    "Match with an Indian therapist who understands NRI life. Takes 2 minutes. Available in Hindi, Tamil, Telugu & more. Sessions from $39. Secure payment via Stripe.",
  alternates: { canonical: `${APP_URL}/book` },
  openGraph: {
    title: "Book Your Session | India Therapist",
    description:
      "Match with an Indian therapist who understands NRI life. Takes 2 minutes. Sessions from $39.",
    url: `${APP_URL}/book`,
    type: "website",
    images: [{ url: `${APP_URL}/logo.png`, width: 1200, height: 630, alt: "India Therapist" }],
  },
  twitter: {
    card: "summary",
    title: "Book Your Session | India Therapist",
    description: "Indian therapists who understand NRI life. Sessions from $39.",
  },
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
