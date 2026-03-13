import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.indiatherapist.com";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "India Therapist — Therapy for NRIs, in your language",
    template: "%s | India Therapist",
  },
  description:
    "Connect with experienced Indian therapists who understand visa anxiety, family pressure, and the loneliness of living between two worlds. Available in 11 languages across all time zones.",
  keywords: [
    "Indian therapist online", "NRI therapy", "therapy for Indians abroad",
    "Hindi therapist", "Tamil therapist", "Indian psychologist online",
    "therapy for NRI", "online therapy India", "mental health NRI",
  ],
  authors: [{ name: "India Therapist", url: APP_URL }],
  creator: "India Therapist",
  publisher: "India Therapist",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    title: "India Therapist — Therapy for NRIs, in your language",
    description:
      "Connect with experienced Indian therapists who understand visa anxiety, family pressure, and the loneliness of living between two worlds.",
    url: APP_URL,
    siteName: "India Therapist",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: `${APP_URL}/og-default.png`,
        width: 1200,
        height: 630,
        alt: "India Therapist — Therapy for NRIs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "India Therapist — Therapy for NRIs, in your language",
    description:
      "Online therapy with Indian therapists who understand your world. In your language, on your schedule.",
    images: [`${APP_URL}/og-default.png`],
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
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
