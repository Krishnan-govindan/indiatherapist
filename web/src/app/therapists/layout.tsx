import type { Metadata } from "next";
import JsonLd from "@/components/SEO/JsonLd";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.indiatherapist.com";

export const metadata: Metadata = {
  title: "Find an Indian Therapist Online for NRIs | 26+ Therapists | India Therapist",
  description:
    "Browse 26+ licensed Indian therapists specializing in NRI mental health. Filter by language (Hindi, Tamil, Telugu…), specialty, and timezone. Online sessions from $39.",
  alternates: { canonical: `${APP_URL}/therapists` },
  openGraph: {
    title: "Find Your Indian Therapist | India Therapist",
    description:
      "Licensed Indian therapists for NRIs. Hindi, Tamil, Telugu and more. Online sessions from $39.",
    url: `${APP_URL}/therapists`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Find Your Indian Therapist | India Therapist",
    description: "Therapists who understand the NRI experience. Filter by language, specialty, and more.",
  },
};

// Static ItemList using known seed therapists — augmented by dynamic data once API is live
const ITEM_LIST_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Indian Therapists for NRIs",
  description: "Licensed Indian therapists available for online sessions worldwide",
  url: `${APP_URL}/therapists`,
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      url: `${APP_URL}/therapists/dr-priya-sharma`,
      name: "Dr. Priya Sharma — Anxiety & CBT Therapist",
    },
    {
      "@type": "ListItem",
      position: 2,
      url: `${APP_URL}/therapists/kavitha-rajan`,
      name: "Kavitha Rajan — Relationship & Couples Therapist",
    },
    {
      "@type": "ListItem",
      position: 3,
      url: `${APP_URL}/therapists/rahul-deshmukh`,
      name: "Rahul Deshmukh — Family & Grief Therapist",
    },
  ],
};

export default function TherapistsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd schema={ITEM_LIST_SCHEMA} />
      {children}
    </>
  );
}
