import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import ChatWidget from "@/components/ChatWidget";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.indiatherapist.com";

const LOGO_URL = `${APP_URL}/logo.png`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "India Therapist — #1 Online Therapy Platform for NRIs",
    template: "%s | India Therapist",
  },
  description:
    "Connect with experienced Indian therapists online. The only therapy platform exclusively for NRIs — available in Hindi, Tamil, Telugu, Gujarati, Marathi & 7 more languages. From $39/session.",
  keywords: [
    // Tier 1 — high-intent
    "online therapy for NRIs", "Indian therapist online", "therapy for Indians abroad",
    "NRI mental health", "Hindi speaking therapist online", "Indian psychologist online",
    "NRI therapy platform", "culturally sensitive therapy Indians",
    "Indian therapist for anxiety", "NRI couples therapy",
    "premarital counseling Indian", "Indian LGBTQIA therapist",
    // Tier 2 — geo & long-tail
    "online therapy for NRIs in USA", "online therapy for NRIs in UK",
    "online therapy for NRIs in Canada", "online therapy for NRIs in Australia",
    "Hindi therapist online", "Tamil therapist online", "Telugu therapist online",
    "therapy for Indian immigrants", "NRI loneliness therapy",
    "work visa stress therapy", "Indian therapist for depression",
    "affordable therapy for NRIs",
  ],
  icons: {
    icon: [
      { url: LOGO_URL, sizes: "32x32" },
      { url: LOGO_URL, sizes: "192x192" },
      { url: LOGO_URL, sizes: "512x512" },
    ],
    shortcut: LOGO_URL,
    apple: [{ url: LOGO_URL, sizes: "180x180" }],
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
    type: "website",
    siteName: "India Therapist",
    title: "India Therapist — Online Therapy for NRIs in Your Language",
    description:
      "The only online therapy platform built exclusively for NRIs. Connect with Indian therapists who understand visa anxiety, family pressure & cultural identity — in Hindi, Tamil, Telugu & more.",
    url: APP_URL,
    locale: "en_US",
    images: [
      {
        url: LOGO_URL,
        width: 1200,
        height: 630,
        alt: "India Therapist — Online Therapy for NRIs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@indiatherapist",
    creator: "@indiatherapist",
    title: "India Therapist — Online Therapy for NRIs",
    description:
      "Indian therapists who truly understand NRI life. 11 languages, from $39/session.",
    images: [LOGO_URL],
  },
  alternates: {
    canonical: APP_URL,
  },
  verification: {
    google: "ADD_GOOGLE_SEARCH_CONSOLE_CODE_HERE",
    other: {
      "msvalidate.01": "ADD_BING_WEBMASTER_CODE_HERE",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="antialiased">
        {children}
        <ChatWidget />
      </body>
      {/* Google Analytics — set NEXT_PUBLIC_GA_ID in environment variables */}
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </html>
  );
}
