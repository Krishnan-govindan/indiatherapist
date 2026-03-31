/**
 * JSON-LD schema generators for India Therapist.
 * Used across homepage, therapist listing, and therapist profile pages.
 */

import { SEO_CONFIG } from "./seoConfig";

const APP_URL = SEO_CONFIG.siteUrl;

// ─────────────────────────────────────────────────────────────
// Organization + MedicalBusiness
// ─────────────────────────────────────────────────────────────

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "MedicalBusiness"],
    "@id": `${APP_URL}/#organization`,
    name: SEO_CONFIG.siteName,
    url: APP_URL,
    logo: {
      "@type": "ImageObject",
      url: SEO_CONFIG.ogImage,
      width: 512,
      height: 512,
    },
    description:
      "India's only dedicated online therapy platform for NRIs worldwide. Connecting NRIs to top Indian therapists who understand your culture, your struggles, and your language.",
    areaServed: SEO_CONFIG.countriesServed,
    availableLanguage: SEO_CONFIG.languages,
    priceRange: SEO_CONFIG.priceRange,
    sameAs: [
      "https://www.facebook.com/indiatherapist",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: ["English", "Hindi"],
    },
  };
}

// ─────────────────────────────────────────────────────────────
// WebSite (enables Google Sitelinks Search Box)
// ─────────────────────────────────────────────────────────────

export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${APP_URL}/#website`,
    name: SEO_CONFIG.siteName,
    url: APP_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${APP_URL}/therapists?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ─────────────────────────────────────────────────────────────
// FAQPage
// ─────────────────────────────────────────────────────────────

export function getFaqSchema(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

// ─────────────────────────────────────────────────────────────
// ItemList (therapist directory)
// ─────────────────────────────────────────────────────────────

export function getItemListSchema(
  therapists: Array<{
    full_name: string;
    slug: string;
    session_rate_cents: number;
    specialties: string[];
  }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Indian Therapists for NRIs",
    description:
      "Browse top Indian therapists available online for NRIs worldwide.",
    url: `${APP_URL}/therapists`,
    numberOfItems: therapists.length,
    itemListElement: therapists.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.full_name,
      url: `${APP_URL}/therapists/${t.slug}`,
      description: `Online therapy with ${t.full_name}. Specializes in ${t.specialties.slice(0, 2).join(" & ")}. $${(t.session_rate_cents / 100).toFixed(0)}/session.`,
    })),
  };
}

// ─────────────────────────────────────────────────────────────
// Person + Physician (therapist profile)
// ─────────────────────────────────────────────────────────────

export function getTherapistSchema(therapist: {
  full_name: string;
  slug: string;
  session_rate_cents: number;
  specialties: string[];
  languages: string[];
  experience_years: number | null;
  photo_url: string | null;
  bio: string | null;
  education: string | null;
  credentials: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": ["Person", "Physician"],
    name: therapist.full_name,
    jobTitle: "Licensed Therapist",
    description: therapist.bio ?? undefined,
    knowsLanguage: therapist.languages,
    image: therapist.photo_url ?? undefined,
    url: `${APP_URL}/therapists/${therapist.slug}`,
    worksFor: {
      "@type": "Organization",
      name: SEO_CONFIG.siteName,
      url: APP_URL,
    },
    hasCredential: therapist.credentials
      ? {
          "@type": "EducationalOccupationalCredential",
          credentialCategory: therapist.credentials,
        }
      : undefined,
    alumniOf: therapist.education
      ? { "@type": "EducationalOrganization", name: therapist.education }
      : undefined,
    offers: {
      "@type": "Offer",
      price: (therapist.session_rate_cents / 100).toString(),
      priceCurrency: "USD",
      description: "60-minute online therapy session",
      availability: "https://schema.org/InStock",
      url: `${APP_URL}/book?therapist=${therapist.slug}`,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// BlogPosting (Article) — individual blog post
// ─────────────────────────────────────────────────────────────

export function getBlogPostSchema(post: {
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
  author_name: string;
  published_at: string;
  updated_at: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.featured_image_url ?? undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    url: `${APP_URL}/blogs/${post.slug}`,
    mainEntityOfPage: `${APP_URL}/blogs/${post.slug}`,
    author: {
      "@type": "Organization",
      name: post.author_name,
      url: APP_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SEO_CONFIG.siteName,
      url: APP_URL,
      logo: {
        "@type": "ImageObject",
        url: SEO_CONFIG.ogImage,
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────
// BreadcrumbList
// ─────────────────────────────────────────────────────────────

export function getBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
