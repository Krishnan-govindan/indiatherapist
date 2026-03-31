import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.indiatherapist.com";

const SEED_SLUGS = ["dr-priya-sharma", "kavitha-rajan", "rahul-deshmukh"];

async function fetchBlogSlugs(): Promise<{ slug: string; published_at: string }[]> {
  try {
    const apiUrl = process.env.API_URL ?? "http://localhost:3001";
    const res = await fetch(`${apiUrl}/api/blogs?limit=1000`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.posts ?? []).map((p: { slug: string; published_at: string }) => ({
      slug: p.slug,
      published_at: p.published_at,
    }));
  } catch {
    return [];
  }
}

async function fetchTherapistSlugs(): Promise<string[]> {
  try {
    const apiUrl = process.env.API_URL ?? "http://localhost:3001";
    const res = await fetch(`${apiUrl}/api/therapists`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error("unavailable");
    const data = await res.json();
    const therapists: { slug: string }[] = data.therapists ?? data ?? [];
    return therapists.map((t) => t.slug).filter(Boolean);
  } catch {
    return SEED_SLUGS;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, blogPosts] = await Promise.all([
    fetchTherapistSlugs(),
    fetchBlogSlugs(),
  ]);
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: APP_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${APP_URL}/therapists`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${APP_URL}/book`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${APP_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${APP_URL}/nri-mental-health`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // GEO-targeted city/language landing pages
  // These pages will be created in a later step — included here to prime the sitemap
  const landingPages: MetadataRoute.Sitemap = [
    { url: `${APP_URL}/nri-therapist-australia`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${APP_URL}/nri-therapist-usa`,       lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${APP_URL}/nri-therapist-canada`,    lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${APP_URL}/nri-therapist-uk`,        lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${APP_URL}/nri-therapist-singapore`, lastModified: now, changeFrequency: "weekly", priority: 0.80 },
    { url: `${APP_URL}/nri-therapist-uae`,       lastModified: now, changeFrequency: "weekly", priority: 0.80 },
    { url: `${APP_URL}/hindi-therapist-online`,  lastModified: now, changeFrequency: "weekly", priority: 0.80 },
    { url: `${APP_URL}/tamil-therapist-online`,  lastModified: now, changeFrequency: "weekly", priority: 0.80 },
    { url: `${APP_URL}/telugu-therapist-online`, lastModified: now, changeFrequency: "weekly", priority: 0.80 },
  ];

  const therapistRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${APP_URL}/therapists/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const blogRoutes: MetadataRoute.Sitemap = [
    {
      url: `${APP_URL}/blogs`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...blogPosts.map((post) => ({
      url: `${APP_URL}/blogs/${post.slug}`,
      lastModified: new Date(post.published_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];

  return [...staticRoutes, ...landingPages, ...therapistRoutes, ...blogRoutes];
}
