import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.indiatherapist.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // All crawlers — allow everything except admin/private routes
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/book/confirmation"],
      },
      // AI search bots — explicitly allow full access for GEO (Generative Engine Optimisation)
      { userAgent: "GPTBot",         allow: "/" },
      { userAgent: "PerplexityBot",  allow: "/" },
      { userAgent: "ClaudeBot",      allow: "/" },
      { userAgent: "anthropic-ai",   allow: "/" },
      { userAgent: "ChatGPT-User",   allow: "/" },
      { userAgent: "OAI-SearchBot",  allow: "/" },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
