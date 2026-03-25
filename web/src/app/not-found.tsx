import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | India Therapist",
  description: "This page doesn't exist. Browse our Indian therapist directory or return to the homepage.",
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#F8F5FF] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold text-[#7B5FB8]/20 mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
          404
        </div>
        <div className="text-4xl mb-4">🔍</div>
        <h1
          className="text-2xl font-bold text-gray-900 mb-3"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Page not found
        </h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          This page doesn&apos;t exist or has moved. Browse our therapist directory to find the right match for you.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-[#7B5FB8] px-6 py-3 text-sm font-semibold text-[#7B5FB8] hover:bg-[#7B5FB8]/5 transition-colors"
          >
            ← Back to Home
          </Link>
          <Link
            href="/therapists"
            className="inline-flex items-center justify-center rounded-full bg-[#7B5FB8] px-6 py-3 text-sm font-semibold text-white hover:bg-[#6B4AA0] transition-colors"
          >
            Browse Therapists →
          </Link>
        </div>
      </div>
    </main>
  );
}
