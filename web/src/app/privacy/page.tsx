import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | India Therapist",
  description:
    "Privacy Policy for India Therapist — how we collect, use, and protect your personal information.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-gray-800">
      {/* Header */}
      <header className="bg-[#0d3b2e] text-white py-10 px-6 text-center">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-green-200 text-sm">Last updated: March 2026</p>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-[15px] leading-relaxed">

        <section>
          <h2 className="text-xl font-semibold text-[#0d3b2e] mb-3">1. About Us</h2>
          <p>
            India Therapist (<strong>indiatherapist.com</strong>) is an online therapy
            matchmaking platform that connects Non-Resident Indians (NRIs) and people of
            Indian origin worldwide with qualified, culturally aware therapists based in
            India. We are owned and operated by <strong>Neo Happylyf Mind Care</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0d3b2e] mb-3">2. Information We Collect</h2>
          <p>We collect the following types of information when you use our services:</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li><strong>Contact details:</strong> Your name, phone number, email address, and country of residence.</li>
            <li><strong>Health &amp; wellness information:</strong> The concerns or challenges you share with us when seeking therapy (e.g., anxiety, relationship issues), which we treat as sensitive personal data.</li>
            <li><strong>Communication data:</strong> Messages you send us via WhatsApp or our website contact forms.</li>
            <li><strong>Payment information:</strong> Transaction details processed securely through Stripe. We do not store full card numbers.</li>
            <li><strong>Usage data:</strong> Basic analytics about how you interact with our website (pages visited, session duration), collected via Google Analytics.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0d3b2e] mb-3">3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>Match you with the right therapist based on your needs, language preference, and location.</li>
            <li>Communicate with you via WhatsApp and email about your session bookings, confirmations, and reminders.</li>
            <li>Process payments for therapy sessions.</li>
            <li>Improve our platform and services through anonymised analytics.</li>
            <li>Comply with legal obligations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0d3b2e] mb-3">4. WhatsApp Messaging</h2>
          <p>
            We use the <strong>WhatsApp Business API</strong> (provided by Meta Platforms Inc.)
            to communicate with you. When you contact us or submit your details on our website,
            you consent to receiving WhatsApp messages from us regarding your therapy inquiry.
            You can opt out at any time by replying <strong>&quot;STOP&quot;</strong> to any of our messages.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0d3b2e] mb-3">5. How We Share Your Information</h2>
          <p>We do <strong>not</strong> sell your personal data. We share your information only with:</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li><strong>Therapists:</strong> To facilitate your sessions, we share your name and the concerns you have described.</li>
            <li><strong>Service providers:</strong> Supabase (database), Stripe (payments), Resend (emails), Meta (WhatsApp), and Vapi (voice calls) — all bound by strict data processing agreements.</li>
            <li><strong>Legal authorities:</strong> Only when required by law.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0d3b2e] mb-3">6. Data Security</h2>
          <p>
            We implement industry-standard security measures including encrypted connections
            (HTTPS/TLS), access controls, and secure cloud infrastructure. Sensitive data is
            stored in encrypted databases. Despite our precautions, no system is 100% secure —
            we encourage you to contact us immediately if you suspect any unauthorised access.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0d3b2e] mb-3">7. Data Retention</h2>
          <p>
            We retain your personal data for as long as necessary to provide our services and
            comply with legal obligations — typically up to <strong>3 years</strong> after your
            last interaction with us. You may request deletion of your data at any time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0d3b2e] mb-3">8. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your data (&quot;right to be forgotten&quot;).</li>
            <li>Withdraw consent for WhatsApp communications at any time.</li>
            <li>Lodge a complaint with your local data protection authority.</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, please contact us at{" "}
            <a href="mailto:support@indiatherapist.com" className="text-green-700 underline">
              support@indiatherapist.com
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0d3b2e] mb-3">9. Cookies</h2>
          <p>
            Our website uses minimal cookies — primarily for analytics (Google Analytics) and
            to maintain your admin session if applicable. You can disable cookies in your
            browser settings, though some features may not work as expected.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0d3b2e] mb-3">10. Children&apos;s Privacy</h2>
          <p>
            Our services are intended for adults (18+). We do not knowingly collect personal
            information from children under 18. If you believe a child has provided us with
            personal data, please contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0d3b2e] mb-3">11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Any changes will be posted
            on this page with an updated date. We encourage you to review this page periodically.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0d3b2e] mb-3">12. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us:</p>
          <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-1">
            <p><strong>India Therapist / Neo Happylyf Mind Care</strong></p>
            <p>Email:{" "}
              <a href="mailto:support@indiatherapist.com" className="text-green-700 underline">
                support@indiatherapist.com
              </a>
            </p>
            <p>WhatsApp: +1 (425) 442-4167</p>
            <p>Website:{" "}
              <a href="https://indiatherapist.com" className="text-green-700 underline">
                indiatherapist.com
              </a>
            </p>
          </div>
        </section>

        <div className="border-t pt-6 text-center text-sm text-gray-500">
          <p>
            Also see our{" "}
            <Link href="/terms" className="text-green-700 underline">
              Terms of Service
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
