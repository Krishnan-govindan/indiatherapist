import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import TherapistsPreview from "@/components/TherapistsPreview";
import JsonLd from "@/components/SEO/JsonLd";
import { getOrganizationSchema, getWebSiteSchema, getFaqSchema } from "@/lib/schemas";

const WA_LINK = "https://wa.me/18568782862"; // Meta API WhatsApp: +1 (856) 878-2862

// ─────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#F8F5FF] via-[#F0EBFF] to-[#E0D5FF] py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
      {/* Background hero image with overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero.jpg"
          alt=""
          fill
          className="object-cover object-center opacity-10"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#F8F5FF]/95 via-[#F0EBFF]/90 to-[#E0D5FF]/85" />
      </div>
      {/* Background blobs */}
      <div
        aria-hidden
        className="absolute -top-24 -right-24 h-[500px] w-[500px] rounded-full bg-[#7B5FB8]/5 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-24 -left-24 h-[400px] w-[400px] rounded-full bg-[#A78BDE]/10 blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#7B5FB8]/20 bg-[#7B5FB8]/8 px-4 py-1.5 text-sm font-medium text-[#7B5FB8]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7B5FB8] animate-pulse" />
            Exclusively for NRIs &amp; the Indian diaspora
          </div>

          {/* Headline */}
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            #1 Online Indian Therapy Platform{" "}
            <span className="text-[#7B5FB8] italic">for NRIs</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-10 max-w-2xl mx-auto">
            Connecting NRIs to top Indian therapists who truly understand your
            culture, your struggles, and your language. Culturally tailored
            therapy — affordable, confidential, and available across every time zone.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/therapists"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#7B5FB8] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#7B5FB8]/25 hover:bg-[#6B4AA0] transition-all hover:-translate-y-0.5"
            >
              Find Your Therapist →
            </Link>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full border-2 border-[#25D366] px-8 py-4 text-base font-semibold text-[#7B5FB8] hover:bg-[#25D366]/10 transition-colors"
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
  "👩‍⚕️ 26 therapists",
  "🗣️ 12 languages",
  "💰 From $39/session",
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
            style={{ fontFamily: "'Outfit', sans-serif" }}
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
              className="rounded-2xl border border-gray-100 bg-[#F8F5FF] overflow-hidden hover:border-[#7B5FB8]/20 hover:shadow-sm transition-all"
            >
              {point.image && (
                <div className="relative h-48 w-full">
                  <Image
                    src={point.image}
                    alt={point.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
              )}
              <div className="p-8">
                <div className="mb-4 text-4xl">{point.emoji}</div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  {point.title}
                </h3>
                <p className="text-gray-500 leading-relaxed">{point.body}</p>
              </div>
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
    body: "Whether you moved for work or as a trailing spouse, the isolation of starting over in a new country without family support takes a real toll.",
    image: "/images/pain-loneliness.jpg",
  },
  {
    emoji: "😰",
    title: "Visa & career anxiety",
    body: "Constant layoffs, H-1B uncertainty, work permit stress — the fear of losing everything you built abroad keeps you up at night.",
    image: "/images/pain-visa-2.jpg",
  },
  {
    emoji: "📞",
    title: "Family pressure from 10,000 miles",
    body: "Marriage expectations, parenting across cultures, eldercare guilt — your family loves you but the pressure never stops.",
    image: "/images/pain-family-2.jpg",
  },
  {
    emoji: "🪞",
    title: "Cultural identity & LGBTQIA+",
    body: "Navigating bicultural identity, coming out in a traditional family, or feeling too Indian for your colleagues and too Western for family back home.",
    image: "/images/pain-identity-2.jpg",
  },
];

// ─────────────────────────────────────────────────────────────
// How It Works
// ─────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-[#7B5FB8] py-20 px-4 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <h2
            className="text-3xl sm:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            How it works
          </h2>
          <p className="text-[#C4B5F0] text-lg">
            From first message to first session in less than 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="text-center">
              <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-4xl">
                {step.icon}
                <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#A78BDE] text-xs font-bold text-white">
                  {i + 1}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                {step.title}
              </h3>
              <p className="text-[#C4B5F0] text-sm leading-relaxed max-w-xs mx-auto">
                {step.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/therapists"
            className="inline-flex items-center gap-2 rounded-full bg-[#A78BDE] px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-[#9B7FD4] transition-all hover:-translate-y-0.5"
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
// Services — What We Help With
// ─────────────────────────────────────────────────────────────

function Services() {
  return (
    <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            What We Help With
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            Specialized support for the unique mental health challenges NRIs face every day.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Link
              key={service.title}
              href="/therapists"
              className="group rounded-2xl border border-gray-100 bg-[#F8F5FF] overflow-hidden hover:border-[#7B5FB8]/30 hover:shadow-md transition-all"
            >
              {service.image && (
                <div className="relative h-44 w-full">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="mb-3 text-3xl">{service.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-[#7B5FB8] transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-500 leading-relaxed text-sm">{service.body}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const services = [
  {
    icon: "💙",
    title: "Depression & Stress",
    body: "Coping with isolation, adjustment struggles, and the mental load of building a life far from home.",
    image: "/images/svc-depression.jpg",
  },
  {
    icon: "💑",
    title: "Marriage & Couples Counseling",
    body: "Long-distance relationships, cultural expectations, communication breakdowns, and rebuilding trust.",
    image: "/images/svc-couples-2.jpg",
  },
  {
    icon: "🏠",
    title: "Loneliness & Homesickness",
    body: "For trailing spouses, new immigrants, and anyone who feels invisible in a country that isn't quite home yet.",
    image: "/images/svc-loneliness.jpg",
  },
  {
    icon: "💼",
    title: "Work Stress & Career Anxiety",
    body: "Visa-dependent employment, constant layoffs, burnout, and the pressure of justifying your life abroad.",
    image: "/images/svc-workstress.jpg",
  },
  {
    icon: "💍",
    title: "Premarital Counseling",
    body: "Navigating cross-cultural relationships, family approval, and building a strong foundation before marriage.",
    image: "/images/svc-premarital.jpg",
  },
  {
    icon: "🌈",
    title: "LGBTQIA+ Support",
    body: "Culturally sensitive identity exploration, coming out in traditional families, and finding acceptance on your own terms.",
    image: "/images/svc-lgbtq.jpg",
  },
];

// ─────────────────────────────────────────────────────────────
// Trust Signals
// ─────────────────────────────────────────────────────────────

function TrustSignals() {
  return (
    <section className="bg-[#F8F5FF] py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "'Outfit', sans-serif" }}
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
    title: "Culturally tailored therapy",
    body: "Top Indian therapists who speak your language — Hindi, Tamil, Telugu, Gujarati, Marathi, Kannada, Malayalam, Punjabi, and more.",
  },
  {
    icon: "💰",
    title: "Affordable therapy for NRIs",
    body: "$39–$141/session vs. $150–$300 in the US or UK. Quality therapy that doesn't break the bank.",
  },
  {
    icon: "✅",
    title: "Risk-free first session",
    body: "Not the right fit? Full refund, no questions asked. We want this to work for you.",
  },
  {
    icon: "🌐",
    title: "Online counseling from anywhere",
    body: "Attend sessions from wherever you are in the world. No commute, no waiting rooms — just you and your therapist.",
  },
  {
    icon: "🎓",
    title: "10–22 years clinical experience",
    body: "Licensed professionals like Aekta (22 yrs), Suvarna (14 yrs), and Niyatii (13 yrs). No freshers, no exceptions.",
  },
  {
    icon: "🤝",
    title: "Exceptional service, every step",
    body: "From your first WhatsApp message to your first session in under 24 hours. We coordinate everything so you don't have to.",
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
            style={{ fontFamily: "'Outfit', sans-serif" }}
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
              className="rounded-2xl bg-[#F8F5FF] border border-[#7B5FB8]/10 p-8 flex flex-col"
            >
              <blockquote className="flex-1 text-gray-700 leading-relaxed italic mb-6">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7B5FB8] text-sm font-semibold text-white">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {t.name}
                  </div>
                  <div className="text-xs text-gray-400">{t.location}</div>
                </div>
                <div className="ml-auto text-[#A78BDE]">{"★".repeat(5)}</div>
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
    name: "KomalPreet",
    location: "Seattle, USA",
    quote:
      "Managing a full-time job and personal life with kids was very stressful being an NRI without any family support. India Therapist helped me improve my self-esteem drastically and change my lifestyle. Therapist Gunjan was amazing and supportive.",
  },
  {
    name: "Rakshita",
    location: "Vancouver, Canada",
    quote:
      "India Therapist helped me overcome loneliness abroad as a housewife, speak up confidently, and voice my opinions whenever needed. I was able to let go of the thoughts that were holding me back.",
  },
  {
    name: "Krishna",
    location: "San Francisco, USA",
    quote:
      "India Therapist helped me handle the stress and overcome depression during constant layoffs, visa issues, and uncertainty about my life as an NRI. I highly recommend them!",
  },
];

// ─────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────

function FAQ() {
  return (
    <section className="bg-[#F8F5FF] py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-14">
          <h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Frequently asked questions
          </h2>
          <p className="text-gray-500 text-lg">
            Everything you need to know before your first session.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl bg-white border border-gray-100 shadow-sm"
            >
              <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-semibold text-gray-900 hover:text-[#7B5FB8] transition-colors [&::-webkit-details-marker]:hidden list-none">
                <span>{faq.q}</span>
                <svg
                  className="h-5 w-5 shrink-0 text-[#7B5FB8] transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-gray-500 leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

const faqs = [
  {
    q: "What issues can therapy help me with?",
    a: "Our therapists specialize in depression, stress, anxiety, loneliness, marriage and couples counseling, work stress, premarital counseling, LGBTQIA+ support, relationship challenges, trauma, grief, self-esteem issues, and personal growth. If you're an NRI dealing with any of these, we're here for you.",
  },
  {
    q: "How is India Therapist different from regular online therapy?",
    a: "We are the #1 culturally tailored therapy platform built exclusively for NRIs. Our therapists are all Indian, understand your cultural context — from family pressure to visa anxiety — and speak your language. You won't need to explain what Diwali is or why your parents' opinion matters so much.",
  },
  {
    q: "How do I know if I need therapy?",
    a: "If you're feeling persistently stressed, lonely, anxious, or struggling with relationships, work, or identity — therapy can help. You don't need to be in crisis to benefit. Many NRIs reach out simply because they want someone who understands their world.",
  },
  {
    q: "What should I expect during a therapy session?",
    a: "Your first session is a safe, confidential space to share what's on your mind. Your therapist will listen, understand your concerns, and work with you on a personalized plan. Sessions are 60 minutes via secure video call — attend from anywhere in the world.",
  },
  {
    q: "How long does therapy typically last?",
    a: "It varies by person and concern. Some clients find clarity in 4-6 sessions, while others prefer ongoing support. Your therapist will work with you to set goals and decide what feels right. There are no long-term commitments required.",
  },
  {
    q: "How much does a session cost?",
    a: "Sessions range from $39 to $141 per 60-minute session, depending on the therapist's experience and specialization. That's up to 60% less than typical therapy rates in the US or UK — affordable, culturally tailored therapy.",
  },
  {
    q: "What if I don't feel a connection with my therapist?",
    a: "Your first session is risk-free. If it's not the right fit, you get a full refund — no questions asked. We can also help you switch to another therapist at no extra cost. The right connection matters.",
  },
  {
    q: "How can therapy benefit my personal development?",
    a: "Beyond addressing specific concerns, therapy helps you build self-awareness, improve communication, manage stress, and develop healthier relationships. Many NRIs use therapy to navigate cultural identity, career transitions, and family dynamics more effectively.",
  },
];

// ─────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-[#7B5FB8] text-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <p className="text-xl font-semibold mb-3">India Therapist</p>
            <p className="text-[#C4B5F0] text-sm leading-relaxed">
              Therapy for NRIs, by therapists who understand your world.
            </p>
          </div>

          {/* Therapists */}
          <div>
            <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-[#A78BDE]">
              Therapists
            </h4>
            <ul className="space-y-2.5 text-sm text-[#C4B5F0]">
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
            <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-[#A78BDE]">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm text-[#C4B5F0]">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><a href="https://blogs.indiatherapist.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Blog</a></li>
              <li><Link href="/therapists" className="hover:text-white transition-colors">For Therapists</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-[#A78BDE]">
              Legal
            </h4>
            <ul className="space-y-2.5 text-sm text-[#C4B5F0]">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-[#C4B5F0] text-sm">
            © 2026 India Therapist. All rights reserved.
          </p>
          <p className="text-[#8B7AA0] text-xs max-w-md leading-relaxed">
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
      <JsonLd schema={getOrganizationSchema()} />
      <JsonLd schema={getWebSiteSchema()} />
      <JsonLd schema={getFaqSchema(faqs)} />
      <Navbar />
      <main>
        <Hero />
        <PainPoints />
        <HowItWorks />
        <Services />
        <TrustSignals />
        <TherapistsPreview />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
