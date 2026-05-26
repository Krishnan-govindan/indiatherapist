import Link from "next/link";

interface BookingCardProps {
  therapistName: string;
  therapistSlug: string;
  sessionRateCents: number;
  waNumber?: string | null;
}

export default function BookingCard({
  therapistSlug,
  sessionRateCents,
}: BookingCardProps) {
  const rate = (sessionRateCents / 100).toFixed(0);

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-lg p-6">
      {/* Rate */}
      <div className="mb-5">
        <span className="text-3xl font-bold text-gray-900">${rate}</span>
        <span className="text-gray-500 text-sm ml-1">/ 60-min session</span>
      </div>

      {/* Trust badges */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>🔒</span>
          <span>Secure payment via Stripe</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>🎥</span>
          <span>Video session — attend from anywhere</span>
        </div>
      </div>

      {/* CTA button — same flow as /book page */}
      <Link
        href={`/book?therapist=${therapistSlug}`}
        className="block w-full rounded-full bg-[#7B5FB8] px-6 py-3 text-center text-sm font-semibold text-white hover:bg-[#6B4AA0] transition-colors"
      >
        Book a Session
      </Link>
    </div>
  );
}
