"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function ConfirmationContent() {
  const params = useSearchParams();
  const therapistName = params.get("therapist") ?? "your therapist";

  const waMsg = encodeURIComponent(
    `Hi, my payment was successful. I'm looking forward to my session with ${therapistName}.`
  );
  const waLink = `https://wa.me/14254424167?text=${waMsg}`;

  return (
    <main className="min-h-screen bg-[#F8F5FF] flex flex-col items-center justify-center py-16 px-4">
      <div className="w-full max-w-md text-center">
        {/* Success icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#7B5FB8]/10">
          <svg
            className="h-10 w-10 text-[#7B5FB8]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1
          className="text-3xl font-bold text-gray-900 mb-3"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Payment Successful!
        </h1>
        <p className="text-gray-600 leading-relaxed mb-2">
          Your session with{" "}
          <span className="font-semibold text-gray-900">{therapistName}</span> has
          been booked.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          We&apos;ll reach out on WhatsApp to confirm your session time.
        </p>

        {/* WhatsApp CTA */}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full rounded-full bg-[#25D366] px-6 py-4 text-base font-semibold text-white hover:bg-[#1ebe5d] transition-all hover:-translate-y-0.5 shadow-lg mb-4"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current shrink-0">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.12.553 4.106 1.522 5.832L.057 23.428a.75.75 0 00.921.921l5.596-1.465A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.718 9.718 0 01-4.976-1.366l-.356-.213-3.699.97.987-3.603-.233-.371A9.718 9.718 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
          </svg>
          Continue on WhatsApp
        </a>

        <Link
          href="/therapists"
          className="text-sm text-gray-400 hover:text-[#7B5FB8] transition-colors"
        >
          ← Browse other therapists
        </Link>
      </div>
    </main>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense>
      <ConfirmationContent />
    </Suspense>
  );
}
