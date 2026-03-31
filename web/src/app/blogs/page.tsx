import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/SEO/JsonLd";
import { getBreadcrumbSchema } from "@/lib/schemas";
import { SEO_CONFIG } from "@/lib/seoConfig";

const APP_URL = SEO_CONFIG.siteUrl;

export const metadata: Metadata = {
  title: "Blog — NRI Mental Health Insights & Resources",
  description:
    "Expert articles on NRI mental health, cultural identity, relationship challenges, and therapy guidance from India Therapist's clinical team.",
  alternates: { canonical: `${APP_URL}/blogs` },
  openGraph: {
    title: "Blog — NRI Mental Health Insights | India Therapist",
    description:
      "Expert articles on NRI mental health, cultural identity, and therapy guidance.",
    url: `${APP_URL}/blogs`,
    type: "website",
  },
};

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  featured_image_url: string | null;
  author_name: string;
  published_at: string;
  tags: string[];
  reading_time_min: number | null;
}

async function fetchPosts(): Promise<BlogPost[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    const res = await fetch(`${apiUrl}/api/blogs?limit=50`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.posts ?? [];
  } catch {
    return [];
  }
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

export default async function BlogListPage() {
  const posts = await fetchPosts();

  const breadcrumb = getBreadcrumbSchema([
    { name: "Home", url: APP_URL },
    { name: "Blog", url: `${APP_URL}/blogs` },
  ]);

  return (
    <>
      <JsonLd schema={breadcrumb} />
      <Navbar />
      <main className="min-h-screen bg-[#F8F5FF]">
        {/* Header */}
        <div className="bg-white border-b border-gray-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <h1
              className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Blog
            </h1>
            <p className="text-gray-500 text-lg max-w-2xl">
              Expert insights on NRI mental health, cultural identity, relationships,
              and therapy guidance from our clinical team.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">📝</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No posts yet
              </h2>
              <p className="text-gray-500 mb-6">
                Check back soon — we&apos;re writing our first articles.
              </p>
              <Link
                href="/therapists"
                className="inline-flex items-center gap-2 rounded-full bg-[#7B5FB8] px-6 py-3 text-sm font-semibold text-white hover:bg-[#6B4AA0] transition-colors"
              >
                Browse Therapists →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blogs/${post.slug}`}
                  className="group rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
                >
                  {/* Featured image */}
                  {post.featured_image_url ? (
                    <div className="relative h-48 w-full">
                      <Image
                        src={post.featured_image_url}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="h-48 w-full bg-gradient-to-br from-[#7B5FB8]/10 to-[#A78BDE]/10 flex items-center justify-center">
                      <span className="text-5xl opacity-30">📝</span>
                    </div>
                  )}

                  <div className="p-6">
                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-[#7B5FB8]/10 px-2.5 py-0.5 text-xs font-medium text-[#6B4AA0]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Title */}
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-[#7B5FB8] transition-colors mb-2 line-clamp-2">
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{formatDate(post.published_at)}</span>
                      {post.reading_time_min && (
                        <>
                          <span>·</span>
                          <span>{post.reading_time_min} min read</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
