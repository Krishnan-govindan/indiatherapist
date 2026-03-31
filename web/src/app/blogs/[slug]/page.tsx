import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/SEO/JsonLd";
import { getBlogPostSchema, getBreadcrumbSchema } from "@/lib/schemas";
import { SEO_CONFIG } from "@/lib/seoConfig";

const APP_URL = SEO_CONFIG.siteUrl;

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  featured_image_url: string | null;
  author_name: string;
  status: string;
  published_at: string;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[];
  reading_time_min: number | null;
  created_at: string;
  updated_at: string;
}

async function fetchPost(slug: string): Promise<BlogPost | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    const res = await fetch(`${apiUrl}/api/blogs/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) return { title: "Post Not Found" };

  const title = post.meta_title || post.title;
  const description =
    post.meta_description || post.excerpt || `Read "${post.title}" on India Therapist Blog.`;

  return {
    title,
    description,
    alternates: { canonical: `${APP_URL}/blogs/${post.slug}` },
    openGraph: {
      title,
      description,
      url: `${APP_URL}/blogs/${post.slug}`,
      type: "article",
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      authors: [post.author_name],
      images: post.featured_image_url
        ? [{ url: post.featured_image_url, width: 1200, height: 630 }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) notFound();

  const articleSchema = getBlogPostSchema(post);
  const breadcrumb = getBreadcrumbSchema([
    { name: "Home", url: APP_URL },
    { name: "Blog", url: `${APP_URL}/blogs` },
    { name: post.title, url: `${APP_URL}/blogs/${post.slug}` },
  ]);

  return (
    <>
      <JsonLd schema={articleSchema} />
      <JsonLd schema={breadcrumb} />
      <Navbar />
      <main className="min-h-screen bg-white">
        {/* Hero / Featured Image */}
        {post.featured_image_url && (
          <div className="relative h-64 sm:h-80 lg:h-96 w-full bg-gray-100">
            <Image
              src={post.featured_image_url}
              alt={post.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}

        <article className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#7B5FB8]/10 px-3 py-1 text-xs font-medium text-[#6B4AA0]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-100">
            <span>By {post.author_name}</span>
            <span>·</span>
            <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
            {post.reading_time_min && (
              <>
                <span>·</span>
                <span>{post.reading_time_min} min read</span>
              </>
            )}
          </div>

          {/* Content */}
          <div
            className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-[#7B5FB8] prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-blockquote:border-[#7B5FB8]"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* CTA */}
          <div className="mt-14 pt-8 border-t border-gray-100 text-center">
            <h3
              className="text-xl font-bold text-gray-900 mb-3"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Ready to talk to someone who understands?
            </h3>
            <p className="text-gray-500 mb-6 max-w-lg mx-auto">
              Connect with an Indian therapist who speaks your language and
              understands your cultural context.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/therapists"
                className="rounded-full bg-[#7B5FB8] px-8 py-3 text-sm font-semibold text-white hover:bg-[#6B4AA0] transition-colors"
              >
                Find Your Therapist →
              </Link>
              <Link
                href="/blogs"
                className="rounded-full border border-gray-200 px-8 py-3 text-sm font-semibold text-gray-600 hover:border-[#7B5FB8] hover:text-[#7B5FB8] transition-colors"
              >
                ← Back to Blog
              </Link>
            </div>
          </div>
        </article>
      </main>
    </>
  );
}
