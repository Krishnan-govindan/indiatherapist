import Link from "next/link";
import Navbar from "@/components/Navbar";
import TherapistsPreview from "@/components/TherapistsPreview";
import JsonLd from "@/components/SEO/JsonLd";

const WA_LINK = "https://wa.me/919999999999"; // Replace with real owner number

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.indiatherapist.com";

const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": ["Organization", "MedicalBusiness"],
  name: "India Therapist",
  url: APP_URL,
  logo: `${APP_URL}/logo.png`,
  description: "India's only dedicated online therapy platform for NRIs worldwide",
  areaServed: ["AU", "US", "GB", "CA", "NZ", "SG", "AE", "IN"],
  availableLanguage: ["en", "hi", "ta", "te", "gu", "mr", "kn", "ml", "pa"],
  priceRange: "$97–$144",
  sameAs: ["https://www.facebook.com/indiatherapist"],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    availableLanguage: ["English", "Hindi"],
  },
};

// ─────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF8F0] via-[#FFF0DC] to-[#E8F5F5] py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
      {/* Background blobs */}
      <div
        aria-hidden
        className="absolute -top-24 -right-24 h-[500px] w-[500px] rounded-full bg-[#1B6B6B]/5 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-24 -left-24 h-[400px] w-[400px] rounded-full bg-[#D4A853]/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#1B6B6B]/20 bg-[#1B6B6B]/8 px-4 py-1.5 text-sm font-medium text-[#1B6B6B]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1B6B6B] animate-pulse" />
            Exclusively for NRIs &amp; the Indian diaspora
          </div>

          {/* Headline */}
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Therapy that feels{" "}
            <span className="text-[#1B6B6B] italic">like home</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-10 max-w-2xl mx-auto">
            Connect with experienced Indian therapists who understand visa
            anxiety, family pressure, and the loneliness of living between two
            worlds — in your language, on your schedule.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/therapists"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#1B6B6B] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#1B6B6B]/25 hover:bg-[#134F4F] transition-all hover:-translate-y-0.5"
            >
              Find Your Therapist →
            </Link>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full border-2 border-[#25D366] px-8 py-4 text-base font-semibold text-[#1B6B6B] hover:bg-[#25D366]/10 transition-colors"
            >
              <svg className="h-5 w-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Chat on WhatsApp
            </a>
          </div>

          {/* Trust bar */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
            {trustItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const trustItems = [
  "🌏 NRIs in 14+ countries",
  "👩‍⚕️ 20 therapists",
  "🗣️ 11 languages",
  "💰 From $97/session",
];

// ─────────────────────────────────────────────────────────────
// Pain Points
// ─────────────────────────────────────────────────────────────

function PainPoints() {
  return (
    <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            You don&apos;t have to explain yourself
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            Western therapists don&apos;t understand why your mother&apos;s
            phone call can ruin your week. Our therapists grew up in the same
            culture you did.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {painPoints.map((point) => (
            <div
              key={point.title}
              className="rounded-2xl border border-gray-100 bg-[#FFF8F0] p-8 hover:border-[#1B6B6B]/20 hover:shadow-sm transition-all"
            >
              <div className="mb-4 text-4xl">{point.emoji}</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                {point.title}
              </h3>
              <p className="text-gray-500 leading-relaxed">{point.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const painPoints = [
  {
    emoji: "😔",
    title: "Loneliness abroad",
    body: "You've built a life overseas, but Sunday evenings still feel empty.",
  },
  {
    emoji: "😰",
    title: "Visa & career anxiety",
    body: "H-1B renewals. Layoff waves. The constant question: what if I have to go back?",
  },
  {
    emoji: "📞",
    title: "Family pressure from 10,000 miles",
    body: "Marriage expectations. Career comparisons. The guilt of not being there.",
  },
  {
    emoji: "🪞",
    title: "Cultural identity in crisis",
    body: "Too Indian for your colleagues, too Western for family back home.",
  },
];

// ─────────────────────────────────────────────────────────────
// How It Works
// ─────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-[#1B6B6B] py-20 px-4 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <h2
            className="text-3xl sm:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            How it works
          </h2>
          <p className="text-[#A8D4D4] text-lg">
            From first message to first session in less than 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="text-center">
              <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-4xl">
                {step.icon}
                <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#D4A853] text-xs font-bold text-white">
                  {i + 1}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                {step.title}
              </h3>
              <p className="text-[#A8D4D4] text-sm leading-relaxed max-w-xs mx-auto">
                {step.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/book"
            className="inline-flex items-center gap-2 rounded-full bg-[#D4A853] px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-[#C49843] transition-all hover:-translate-y-0.5"
          >
            Get Started in 2 Minutes →
          </Link>
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    icon: "📝",
    title: "Tell us what you need",
    body: "Fill out a quick form — takes 2 minutes. Tell us your language, what you're going through, and when you're free.",
  },
  {
    icon: "🤝",
    title: "Meet your matched therapist",
    body: "Our AI matches you with the best therapist based on your language, concern, and schedule.",
  },
  {
    icon: "🌿",
    title: "Start healing, in your language",
    body: "Book your first session, pay securely online, and begin your journey — no awkward explanations needed.",
  },
];

// ─────────────────────────────────────────────────────────────
// Trust Signals
// ─────────────────────────────────────────────────────────────

function TrustSignals() {
  return (
    <section className="bg-[#FFF8F0] py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Why NRIs choose us
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trustSignals.map((signal) => (
            <div
              key={signal.title}
              className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-4 text-3xl">{signal.icon}</div>
              <h3 className="mb-1.5 text-base font-semibold text-gray-900">
                {signal.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {signal.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const trustSignals = [
  {
    icon: "🗣️",
    title: "Your language, your culture",
    body: "Sessions in Hindi, Tamil, Telugu, Gujarati, Marathi, Kannada, Malayalam, Punjabi, Bengali, Urdu, and English.",
  },
  {
    icon: "💰",
    title: "60% less than local therapy",
    body: "$97–$144/session vs. $150–$300 in the US or UK. Same quality, radically better value.",
  },
  {
    icon: "✅",
    title: "Risk-free first session",
    body: "Not the right fit? Full refund, no questions asked. We want this to work for you.",
  },
  {
    icon: "🧠",
    title: "NRI-specific specializations",
    body: "Immigration stress, cross-cultural identity, long-distance family relationships — your therapist has been there.",
  },
  {
    icon: "🎓",
    title: "10–22 years clinical experience",
    body: "All therapists are licensed professionals with deep experience. No freshers, no exceptions.",
  },
  {
    icon: "🌍",
    title: "Flexible across all time zones",
    body: "From San Francisco to Singapore, we schedule around your life — mornings, evenings, weekends.",
  },
];

// ─────────────────────────────────────────────────────────────
// Testimonials
// ─────────────────────────────────────────────────────────────

function Testimonials() {
  return (
    <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Stories from the diaspora
          </h2>
          <p className="text-gray-500 text-lg">
            Real experiences from NRIs who found their footing.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="rounded-2xl bg-[#FFF8F0] border border-[#1B6B6B]/10 p-8 flex flex-col"
            >
              <blockquote className="flex-1 text-gray-700 leading-relaxed italic mb-6">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1B6B6B] text-sm font-semibold text-white">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {t.name}
                  </div>
                  <div className="text-xs text-gray-400">{t.location}</div>
                </div>
                <div className="ml-auto text-[#D4A853]">{"★".repeat(5)}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

const testimonials = [
  {
    name: "Ananya",
    location: "California, USA",
    quote:
      "My therapist understood the pressure of being the eldest daughter in a Gujarati family without me having to explain joint family dynamics. It felt like talking to someone who just gets it.",
  },
  {
    name: "Karthik",
    location: "London, UK",
    quote:
      "I was skeptical about online therapy, but my first session changed everything. My therapist addressed my H-1B anxiety in a way no Western counsellor ever could have.",
  },
  {
    name: "Meera",
    location: "Singapore",
    quote:
      "The WhatsApp coordination was seamless — no scheduling back-and-forth. I was in a session within 18 hours of filling out the form. The whole experience felt human.",
  },
];

// ─────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-[#1B6B6B] text-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <p className="text-xl font-semibold mb-3">India Therapist</p>
            <p className="text-[#A8D4D4] text-sm leading-relaxed">
              Therapy for NRIs, by therapists who understand your world.
            </p>
          </div>

          {/* Therapists */}
          <div>
            <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-[#D4A853]">
              Therapists
            </h4>
            <ul className="space-y-2.5 text-sm text-[#A8D4D4]">
              {["Find a Therapist", "Anxiety & Stress", "Relationships", "Family Therapy", "Grief & Loss"].map((l) => (
                <li key={l}>
                  <Link href="/therapists" className="hover:text-white transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-[#D4A853]">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm text-[#A8D4D4]">
              {["About Us", "How It Works", "Blog", "For Therapists"].map((l) => (
                <li key={l}>
                  <Link href="/" className="hover:text-white transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-[#D4A853]">
              Legal
            </h4>
            <ul className="space-y-2.5 text-sm text-[#A8D4D4]">
              {["Privacy Policy", "Terms of Service", "Refund Policy"].map((l) => (
                <li key={l}>
                  <Link href="/" className="hover:text-white transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-[#A8D4D4] text-sm">
            © 2026 India Therapist. All rights reserved.
          </p>
          <p className="text-[#7AADAD] text-xs max-w-md leading-relaxed">
            ⚠️ India Therapist is not a crisis service. If you are in immediate
            danger, please contact your local emergency services or a crisis
            helpline.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      <JsonLd schema={ORG_SCHEMA} />
      <Navbar />
      <main>
        <Hero />
        <PainPoints />
        <HowItWorks />
        <TrustSignals />
        <TherapistsPreview />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
