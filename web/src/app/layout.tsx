import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.indiatherapist.com";

const LOGO_URL = `${APP_URL}/logo.png`;

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "India Therapist — #1 Online Indian Therapy Platform for NRIs",
    template: "%s | India Therapist",
  },
  description:
    "Connecting NRIs to top Indian therapists who understand your culture. Affordable online therapy in Hindi, Tamil, Telugu & 9 more languages. From $39/session across all time zones.",
  keywords: [
    "Indian therapist online", "NRI therapy", "therapy for Indians abroad",
    "Hindi therapist", "Tamil therapist", "Indian psychologist online",
    "therapy for NRI", "online therapy India", "mental health NRI",
    "Indian therapy for depression", "NRI couples therapy",
    "online therapy for loneliness", "LGBTQIA therapy Indian",
    "premarital counseling Indian", "culturally sensitive therapy",
    "affordable therapy for NRIs", "NRI marriage counseling",
    "work stress therapy NRI", "Indian therapist for anxiety",
  ],
  icons: {
    icon: LOGO_URL,
    shortcut: LOGO_URL,
    apple: LOGO_URL,
  },
  authors: [{ name: "India Therapist", url: APP_URL }],
  creator: "India Therapist",
  publisher: "India Therapist",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    title: "India Therapist — #1 Online Indian Therapy Platform for NRIs",
    description:
      "Connecting NRIs to top Indian therapists who understand your culture. Affordable online therapy in 12 languages, from $39/session.",
    url: APP_URL,
    siteName: "India Therapist",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: LOGO_URL,
        width: 1200,
        height: 630,
        alt: "India Therapist — #1 Online Indian Therapy Platform for NRIs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "India Therapist — #1 Online Indian Therapy Platform for NRIs",
    description:
      "Top Indian therapists for NRIs. Culturally tailored, affordable online therapy in your language, on your schedule.",
    images: [LOGO_URL],
    creator: "@indiatherapist",
    site: "@indiatherapist",
  },
  alternates: {
    canonical: APP_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
