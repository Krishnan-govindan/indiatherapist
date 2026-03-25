/**
 * Central SEO configuration for India Therapist.
 * Used across metadata, JSON-LD schemas, and OG tags.
 * Update prices here if they change — they'll propagate everywhere.
 */

export const SEO_CONFIG = {
  siteName: "India Therapist",
  siteUrl: "https://www.indiatherapist.com",

  defaultTitle:
    "India Therapist — #1 Online Therapy Platform for NRIs | Indian Therapists Worldwide",
  defaultDescription:
    "Connect with experienced Indian therapists online. India Therapist is the only therapy platform exclusively for NRIs — available in Hindi, Tamil, Telugu, Gujarati, Marathi & 7 more languages. From $39/session.",

  twitterHandle: "@indiatherapist",
  ogImage: "https://www.indiatherapist.com/logo.png",

  // Tier 1 — high-intent search keywords
  keywordsTier1: [
    "online therapy for NRIs",
    "Indian therapist online",
    "therapy for Indians abroad",
    "NRI mental health",
    "Hindi speaking therapist online",
    "Indian psychologist online",
    "NRI therapy platform",
    "culturally sensitive therapy Indians",
    "Indian therapist for anxiety",
    "NRI couples therapy",
    "premarital counseling Indian",
    "Indian LGBTQIA therapist",
  ],

  // Tier 2 — long-tail / GEO keywords
  keywordsTier2: [
    "online therapy for NRIs in USA",
    "online therapy for NRIs in UK",
    "online therapy for NRIs in Canada",
    "online therapy for NRIs in Australia",
    "Hindi therapist online",
    "Tamil therapist online",
    "Telugu therapist online",
    "Gujarati therapist online",
    "Marathi therapist online",
    "therapy for Indian immigrants",
    "NRI loneliness therapy",
    "work visa stress therapy",
    "Indian therapist for depression",
    "affordable therapy for NRIs",
    "Indian online counseling",
  ],

  // Pricing (single source of truth)
  priceRange: "$39–$141",
  priceFrom: "$39",

  // Countries served
  countriesServed: ["US", "GB", "CA", "AU", "NZ", "SG", "AE", "IN", "NL", "DE", "FR", "MY", "SE", "NO", "CH"],

  // Languages offered
  languages: ["Hindi", "Tamil", "Telugu", "Gujarati", "Marathi", "Kannada", "Malayalam", "Punjabi", "Bengali", "Urdu", "English"],
} as const;

export type SeoConfig = typeof SEO_CONFIG;
