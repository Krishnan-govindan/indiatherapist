"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#F8F5FF] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">😔</div>
        <h1
          className="text-2xl font-bold text-gray-900 mb-3"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Something went wrong
        </h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          We hit an unexpected error. Please try again, or browse our therapist directory.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-full border border-[#7B5FB8] px-6 py-3 text-sm font-semibold text-[#7B5FB8] hover:bg-[#7B5FB8]/5 transition-colors"
          >
            Try again
          </button>
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
