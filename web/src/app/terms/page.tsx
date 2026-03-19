import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | India Therapist",
  description:
    "Terms of Service for India Therapist — the rules and conditions for using our platform.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-gray-800">
      {/* Header */}
      <header className="bg-[#2A1A4A] text-white py-10 px-6 text-center">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-[#C4B5F0] text-sm">Last updated: March 2026</p>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-[15px] leading-relaxed">

        <section>
          <h2 className="text-xl font-semibold text-[#2A1A4A] mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing or using India Therapist (<strong>indiatherapist.com</strong>), you
            agree to be bound by these Terms of Service. If you do not agree, please do not
            use our platform. India Therapist is owned and operated by{" "}
            <strong>Neo Happylyf Mind Care</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#2A1A4A] mb-3">2. Our Services</h2>
          <p>
            India Therapist is a <strong>therapy matchmaking platform</strong> that connects
            NRIs and people of Indian origin worldwide with qualified therapists based in India.
            We facilitate introductions and session bookings but are not a licensed medical
            provider. Our therapists are independent professionals.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#2A1A4A] mb-3">3. Eligibility</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You must be at least 18 years old to use our services.</li>
            <li>Our services are not a substitute for emergency mental health care. If you are in crisis, please contact your local emergency services immediately.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#2A1A4A] mb-3">4. Bookings &amp; Payments</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Session fees are displayed clearly before booking and are charged in USD.</li>
            <li>Payments are processed securely through Stripe.</li>
            <li>Cancellations made more than 24 hours before the session may be eligible for a full refund. Cancellations within 24 hours may be non-refundable.</li>
            <li>We reserve the right to modify pricing with reasonable notice.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#2A1A4A] mb-3">5. WhatsApp Communications</h2>
          <p>
            By submitting your phone number, you consent to receiving WhatsApp messages from
            India Therapist regarding your therapy inquiry, session confirmations, and reminders.
            You may opt out at any time by replying <strong>&quot;STOP&quot;</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#2A1A4A] mb-3">6. Disclaimer</h2>
          <p>
            India Therapist connects clients with therapists but does not directly provide
            therapy services. We are not responsible for the content of sessions or outcomes
            of therapy. All therapists on our platform are independently licensed and responsible
            for their own practice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#2A1A4A] mb-3">7. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, India Therapist shall not be liable for
            any indirect, incidental, or consequential damages arising from use of our platform
            or services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#2A1A4A] mb-3">8. Governing Law</h2>
          <p>
            These Terms are governed by the laws of India. Any disputes shall be subject to
            the exclusive jurisdiction of courts in India.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#2A1A4A] mb-3">9. Contact</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-1">
            <p><strong>India Therapist / Neo Happylyf Mind Care</strong></p>
            <p>Email:{" "}
              <a href="mailto:support@indiatherapist.com" className="text-[#7B5FB8] underline">
                support@indiatherapist.com
              </a>
            </p>
            <p>WhatsApp: +1 (856) 878-2862</p>
          </div>
        </section>

        <div className="border-t pt-6 text-center text-sm text-gray-500">
          <p>
            Also see our{" "}
            <Link href="/privacy" className="text-[#7B5FB8] underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
