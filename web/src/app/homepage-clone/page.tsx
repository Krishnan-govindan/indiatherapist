import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/SEO/JsonLd";
import { getOrganizationSchema, getWebSiteSchema, getFaqSchema } from "@/lib/schemas";
import { FEATURED_THERAPISTS, type TherapistData } from "@/data/therapists";

const WA_LINK = "https://wa.me/14254424167";

// ─────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────

const trustItems = [
  "🌏 NRIs in 14+ countries",
  "👩‍⚕️ 26 therapists",
  "🗣️ 12 languages",
  "💰 From $39/session",
];

const painPoints = [
  { emoji: "😔", title: "Loneliness abroad", body: "Whether you moved for work or as a trailing spouse, the isolation of starting over in a new country without family support takes a real toll.", image: "/images/pain-loneliness.jpg" },
  { emoji: "😰", title: "Visa & career anxiety", body: "Constant layoffs, H-1B uncertainty, work permit stress — the fear of losing everything you built abroad keeps you up at night.", image: "/images/pain-visa.jpg" },
  { emoji: "📞", title: "Family pressure from 10,000 miles", body: "Marriage expectations, parenting across cultures, eldercare guilt — your family loves you but the pressure never stops.", image: "/images/pain-family.jpg" },
  { emoji: "🪞", title: "Cultural identity & LGBTQIA+", body: "Navigating bicultural identity, coming out in a traditional family, or feeling too Indian for your colleagues and too Western for family back home.", image: "/images/pain-identity.jpg" },
];

const steps = [
  { icon: "📝", title: "Tell us what you need", body: "Fill out a quick form — takes 2 minutes. Tell us your language, what you're going through, and when you're free." },
  { icon: "🤝", title: "Meet your matched therapist", body: "Our AI matches you with the best therapist based on your language, concern, and schedule." },
  { icon: "🌿", title: "Start healing, in your language", body: "Book your first session, pay securely online, and begin your journey — no awkward explanations needed." },
];

const services = [
  { icon: "💙", title: "Depression & Stress", body: "Coping with isolation, adjustment struggles, and the mental load of building a life far from home.", image: "/images/svc-depression.jpg" },
  { icon: "💑", title: "Marriage & Couples Counseling", body: "Long-distance relationships, cultural expectations, communication breakdowns, and rebuilding trust.", image: "/images/svc-couples.jpg" },
  { icon: "🏠", title: "Loneliness & Homesickness", body: "For trailing spouses, new immigrants, and anyone who feels invisible in a country that isn't quite home yet.", image: "/images/svc-loneliness.jpg" },
  { icon: "💼", title: "Work Stress & Career Anxiety", body: "Visa-dependent employment, constant layoffs, burnout, and the pressure of justifying your life abroad.", image: "/images/svc-workstress.jpg" },
  { icon: "💍", title: "Premarital Counseling", body: "Navigating cross-cultural relationships, family approval, and building a strong foundation before marriage.", image: "/images/svc-premarital.jpg" },
  { icon: "🌈", title: "LGBTQIA+ Support", body: "Culturally sensitive identity exploration, coming out in traditional families, and finding acceptance on your own terms.", image: "/images/svc-lgbtq.jpg" },
];

const trustSignals = [
  { icon: "🗣️", title: "Culturally tailored therapy", body: "Top Indian therapists who speak your language — Hindi, Tamil, Telugu, Gujarati, Marathi, Kannada, Malayalam, Punjabi, and more." },
  { icon: "💰", title: "Affordable therapy for NRIs", body: "$39–$141/session vs. $150–$300 in the US or UK. Quality therapy that doesn't break the bank." },
  { icon: "✅", title: "Risk-free first session", body: "Not the right fit? Full refund, no questions asked. We want this to work for you." },
  { icon: "🌐", title: "Online counseling from anywhere", body: "Attend sessions from wherever you are in the world. No commute, no waiting rooms — just you and your therapist." },
  { icon: "🎓", title: "10–22 years clinical experience", body: "Licensed professionals like Aekta (22 yrs), Suvarna (14 yrs), and Niyatii (13 yrs). No freshers, no exceptions." },
  { icon: "🤝", title: "Exceptional service, every step", body: "From your first WhatsApp message to your first session in under 24 hours. We coordinate everything so you don't have to." },
];

const testimonials = [
  { name: "KomalPreet", location: "Seattle, USA", quote: "Managing a full-time job and personal life with kids was very stressful being an NRI without any family support. India Therapist helped me improve my self-esteem drastically and change my lifestyle. Therapist Gunjan was amazing and supportive." },
  { name: "Rakshita", location: "Vancouver, Canada", quote: "India Therapist helped me overcome loneliness abroad as a housewife, speak up confidently, and voice my opinions whenever needed. I was able to let go of the thoughts that were holding me back." },
  { name: "Krishna", location: "San Francisco, USA", quote: "India Therapist helped me handle the stress and overcome depression during constant layoffs, visa issues, and uncertainty about my life as an NRI. I highly recommend them!" },
];

const faqs = [
  { q: "What issues can therapy help me with?", a: "Our therapists specialize in depression, stress, anxiety, loneliness, marriage and couples counseling, work stress, premarital counseling, LGBTQIA+ support, relationship challenges, trauma, grief, self-esteem issues, and personal growth. If you're an NRI dealing with any of these, we're here for you." },
  { q: "How is India Therapist different from regular online therapy?", a: "We are the #1 culturally tailored therapy platform built exclusively for NRIs. Our therapists are all Indian, understand your cultural context — from family pressure to visa anxiety — and speak your language. You won't need to explain what Diwali is or why your parents' opinion matters so much." },
  { q: "How do I know if I need therapy?", a: "If you're feeling persistently stressed, lonely, anxious, or struggling with relationships, work, or identity — therapy can help. You don't need to be in crisis to benefit. Many NRIs reach out simply because they want someone who understands their world." },
  { q: "What should I expect during a therapy session?", a: "Your first session is a safe, confidential space to share what's on your mind. Your therapist will listen, understand your concerns, and work with you on a personalized plan. Sessions are 60 minutes via secure video call — attend from anywhere in the world." },
  { q: "How long does therapy typically last?", a: "It varies by person and concern. Some clients find clarity in 4-6 sessions, while others prefer ongoing support. Your therapist will work with you to set goals and decide what feels right. There are no long-term commitments required." },
  { q: "How much does a session cost?", a: "Sessions range from $39 to $141 per 60-minute session, depending on the therapist's experience and specialization. That's up to 60% less than typical therapy rates in the US or UK — affordable, culturally tailored therapy." },
  { q: "What if I don't feel a connection with my therapist?", a: "Your first session is risk-free. If it's not the right fit, you get a full refund — no questions asked. We can also help you switch to another therapist at no extra cost. The right connection matters." },
  { q: "How can therapy benefit my personal development?", a: "Beyond addressing specific concerns, therapy helps you build self-awareness, improve communication, manage stress, and develop healthier relationships. Many NRIs use therapy to navigate cultural identity, career transitions, and family dynamics more effectively." },
];

// ─────────────────────────────────────────────────────────────
// Therapist fetch
// ─────────────────────────────────────────────────────────────

async function fetchTherapists(): Promise<TherapistData[]> {
  try {
    const apiUrl = process.env.API_URL ?? "http://localhost:3001";
    const res = await fetch(`${apiUrl}/api/therapists?featured=true`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("API unavailable");
    const data = await res.json();
    return (data.therapists ?? data ?? []).slice(0, 3);
  } catch {
    return FEATURED_THERAPISTS;
  }
}

// ─────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section
      className="relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6 lg:px-8"
      style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #111111 100%)" }}
    >
      {/* Background hero image with dark overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero.jpg"
          alt=""
          fill
          className="object-cover object-center opacity-5"
          priority
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(10,10,10,0.97) 0%, rgba(26,26,26,0.95) 100%)" }}
        />
      </div>
      {/* Background blobs */}
      <div
        aria-hidden
        className="absolute -top-24 -right-24 h-[500px] w-[500px] rounded-full blur-3xl"
        style={{ background: "rgba(201,176,55,0.06)" }}
      />
      <div
        aria-hidden
        className="absolute -bottom-24 -left-24 h-[400px] w-[400px] rounded-full blur-3xl"
        style={{ background: "rgba(255,215,0,0.04)" }}
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium"
            style={{ border: "1px solid rgba(201,176,55,0.4)", background: "rgba(201,176,55,0.1)", color: "#c9b037" }}
          >
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#c9b037" }} />
            Exclusively for NRIs &amp; the Indian diaspora
          </div>

          {/* Headline */}
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            style={{
              fontFamily: "'Outfit', sans-serif",
              background: "linear-gradient(135deg, #c9b037, #ffd700, #f4d03f)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            #1 Online Indian Therapy Platform{" "}
            <span
              className="italic"
              style={{
                background: "linear-gradient(135deg, #ffd700, #f4d03f, #c9b037)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              for NRIs
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl mx-auto" style={{ color: "#bbb" }}>
            Connecting NRIs to top Indian therapists who truly understand your
            culture, your struggles, and your language. Culturally tailored
            therapy — affordable, confidential, and available across every time zone.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/therapists"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold shadow-lg transition-all hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #c9b037, #ffd700, #f4d03f)",
                color: "#1a1a1a",
                boxShadow: "0 10px 25px rgba(201,176,55,0.3)",
              }}
            >
              Find Your Therapist →
            </Link>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full border-2 border-[#25D366] px-8 py-4 text-base font-semibold hover:bg-[#25D366]/10 transition-colors"
              style={{ color: "#25D366" }}
            >
              <svg className="h-5 w-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Chat on WhatsApp
            </a>
          </div>

          {/* Trust bar */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm" style={{ color: "#999" }}>
            {trustItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Pain Points
// ─────────────────────────────────────────────────────────────

function PainPoints() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: "#111111" }}>
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{
              fontFamily: "'Outfit', sans-serif",
              background: "linear-gradient(135deg, #c9b037, #ffd700, #f4d03f)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            You don&apos;t have to explain yourself
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: "#bbb" }}>
            Western therapists don&apos;t understand why your mother&apos;s
            phone call can ruin your week. Our therapists grew up in the same
            culture you did.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {painPoints.map((point) => (
            <div
              key={point.title}
              className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 relative"
              style={{
                border: "1px solid rgba(201,176,55,0.3)",
                background: "#1a1a1a",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}
            >
              {/* Shimmer top bar */}
              <div
                className="absolute top-0 left-0 w-full z-10"
                style={{
                  height: "4px",
                  background: "linear-gradient(90deg, #c9b037, #ffd700, #f4d03f, #c9b037)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 3s ease-in-out infinite",
                }}
              />
              {point.image && (
                <div className="relative h-48 w-full">
                  <Image
                    src={point.image}
                    alt={point.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.4)" }} />
                </div>
              )}
              <div className="p-8">
                <div
                  className="mb-4 h-14 w-14 flex items-center justify-center rounded-xl text-2xl"
                  style={{ background: "rgba(201,176,55,0.15)", border: "1px solid rgba(201,176,55,0.2)" }}
                >
                  {point.emoji}
                </div>
                <h3 className="mb-2 text-lg font-semibold" style={{ color: "#ffffff" }}>
                  {point.title}
                </h3>
                <p className="leading-relaxed" style={{ color: "#bbb" }}>{point.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// How It Works
// ─────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-20 px-4 sm:px-6 lg:px-8"
      style={{ background: "#0a0a0a" }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{
              fontFamily: "'Outfit', sans-serif",
              background: "linear-gradient(135deg, #c9b037, #ffd700, #f4d03f)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            How it works
          </h2>
          <p className="text-lg" style={{ color: "#999" }}>
            From first message to first session in less than 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="text-center">
              <div
                className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full text-4xl"
                style={{
                  background: "rgba(201,176,55,0.1)",
                  border: "2px solid rgba(201,176,55,0.3)",
                }}
              >
                {step.icon}
                <span
                  className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    background: "linear-gradient(135deg, #c9b037, #ffd700)",
                    color: "#1a1a1a",
                  }}
                >
                  {i + 1}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-semibold" style={{ color: "#ffffff" }}>
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: "#999" }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/therapists"
            className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold shadow-lg transition-all hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #c9b037, #ffd700, #f4d03f)",
              color: "#1a1a1a",
              boxShadow: "0 10px 25px rgba(201,176,55,0.3)",
            }}
          >
            Get Started in 2 Minutes →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Services — What We Help With
// ─────────────────────────────────────────────────────────────

function Services() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: "#111111" }}>
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{
              fontFamily: "'Outfit', sans-serif",
              background: "linear-gradient(135deg, #c9b037, #ffd700, #f4d03f)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            What We Help With
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: "#bbb" }}>
            Specialized support for the unique mental health challenges NRIs face every day.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Link
              key={service.title}
              href="/therapists"
              className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 relative"
              style={{
                border: "1px solid rgba(201,176,55,0.3)",
                background: "#1a1a1a",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}
            >
              {/* Shimmer top bar */}
              <div
                className="absolute top-0 left-0 w-full z-10"
                style={{
                  height: "4px",
                  background: "linear-gradient(90deg, #c9b037, #ffd700, #f4d03f, #c9b037)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 3s ease-in-out infinite",
                }}
              />
              {service.image && (
                <div className="relative h-44 w-full">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.4)" }} />
                </div>
              )}
              <div className="p-6">
                <div
                  className="mb-3 h-12 w-12 flex items-center justify-center rounded-lg text-2xl"
                  style={{ background: "rgba(201,176,55,0.15)", border: "1px solid rgba(201,176,55,0.2)" }}
                >
                  {service.icon}
                </div>
                <h3
                  className="mb-2 text-lg font-semibold transition-colors group-hover:text-[#ffd700]"
                  style={{ color: "#ffffff" }}
                >
                  {service.title}
                </h3>
                <p className="leading-relaxed text-sm" style={{ color: "#bbb" }}>{service.body}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Trust Signals
// ─────────────────────────────────────────────────────────────

function TrustSignals() {
  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8"
      style={{ background: "#0a0a0a" }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{
              fontFamily: "'Outfit', sans-serif",
              background: "linear-gradient(135deg, #c9b037, #ffd700, #f4d03f)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Why NRIs choose us
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trustSignals.map((signal) => (
            <div
              key={signal.title}
              className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "#1a1a1a",
                border: "1px solid rgba(201,176,55,0.3)",
                borderTop: "3px solid #c9b037",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}
            >
              <div
                className="mb-4 h-12 w-12 flex items-center justify-center rounded-lg text-2xl"
                style={{ background: "rgba(201,176,55,0.15)", border: "1px solid rgba(201,176,55,0.2)" }}
              >
                {signal.icon}
              </div>
              <h3 className="mb-1.5 text-base font-semibold" style={{ color: "#ffffff" }}>
                {signal.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#bbb" }}>
                {signal.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Therapists Preview (inline async)
// ─────────────────────────────────────────────────────────────

async function TherapistsPreviewSection() {
  const therapists = await fetchTherapists();

  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8"
      style={{ background: "#111111" }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{
              fontFamily: "'Outfit', sans-serif",
              background: "linear-gradient(135deg, #c9b037, #ffd700, #f4d03f)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Meet Our Expert Therapists
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "#bbb" }}>
            Connect with qualified mental health professionals who understand
            your unique needs and cultural background.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {therapists.map((t) => {
            const isElite = t.tier === "elite";
            return (
              <div
                key={t.id}
                className="group rounded-3xl p-8 transition-all duration-400 flex flex-col text-center relative overflow-hidden"
                style={
                  isElite
                    ? {
                        background: "linear-gradient(135deg, #0a0a0a, #1a1a1a, #0a0a0a)",
                        border: "3px solid #c9b037",
                        boxShadow:
                          "0 0 0 1px #c9b037, 0 20px 60px rgba(201,176,55,0.3), 0 8px 25px rgba(0,0,0,0.4)",
                      }
                    : {
                        background: "linear-gradient(135deg, #1a1a1a, #2d2d2d, #1a1a1a)",
                        border: "2px solid #ffd700",
                        boxShadow: "0 15px 50px rgba(255,215,0,0.15), 0 6px 20px rgba(0,0,0,0.3)",
                      }
                }
              >
                {/* Shimmer top bar */}
                <div
                  className="absolute top-0 left-0 w-full"
                  style={{
                    height: "5px",
                    background: isElite
                      ? "linear-gradient(90deg, #c9b037, #ffd700, #f4d03f, #c9b037)"
                      : "linear-gradient(90deg, #ffd700, #ffed4e, #ffd700)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 3s ease-in-out infinite",
                  }}
                />

                {/* Avatar */}
                <div className="mx-auto mb-5">
                  {t.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.photo_url}
                      alt={t.full_name}
                      className="h-[130px] w-[130px] rounded-full object-cover transition-all duration-400 group-hover:scale-[1.08] group-hover:rotate-3"
                      style={{
                        border: isElite ? "5px solid #c9b037" : "5px solid #ffd700",
                        boxShadow: isElite
                          ? "0 0 20px rgba(201,176,55,0.4), 0 8px 25px rgba(0,0,0,0.3)"
                          : "0 8px 25px rgba(255,215,0,0.2)",
                      }}
                    />
                  ) : (
                    <div
                      className="h-[130px] w-[130px] rounded-full flex items-center justify-center"
                      style={{
                        background: isElite
                          ? "rgba(201,176,55,0.1)"
                          : "rgba(255,215,0,0.15)",
                        border: isElite ? "5px solid #c9b037" : "5px solid #ffd700",
                      }}
                    >
                      <span
                        className="text-3xl font-semibold"
                        style={{ color: isElite ? "#c9b037" : "#ffd700" }}
                      >
                        {t.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Name + verified */}
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <h3
                    className="font-semibold text-xl leading-tight"
                    style={{ color: isElite ? "#c9b037" : "#ffd700" }}
                  >
                    {t.full_name}
                  </h3>
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-white text-[10px] shrink-0"
                    style={{ background: "#16a085" }}
                  >
                    ✓
                  </span>
                </div>

                {/* Experience */}
                {t.experience_years && (
                  <p
                    className="text-sm mb-2"
                    style={{ color: "#e8e8e8" }}
                  >
                    {t.experience_years}+ years experience
                  </p>
                )}

                {/* Tier badge */}
                <div className="mb-4">
                  <span
                    className="inline-block rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider"
                    style={
                      isElite
                        ? {
                            background: "transparent",
                            border: "2px solid #c9b037",
                            color: "#c9b037",
                          }
                        : {
                            background: "transparent",
                            border: "2px solid #16a085",
                            color: "#16a085",
                          }
                    }
                  >
                    {t.tier}
                  </span>
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap justify-center gap-2 mb-3">
                  {t.specialties.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={
                        isElite
                          ? {
                              background: "rgba(201,176,55,0.15)",
                              color: "#c9b037",
                              border: "1px solid rgba(201,176,55,0.3)",
                            }
                          : {
                              background: "rgba(22,160,133,0.1)",
                              color: "#16a085",
                              border: "1px solid rgba(22,160,133,0.2)",
                            }
                      }
                    >
                      {s}
                    </span>
                  ))}
                </div>

                {/* Languages */}
                <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                  {t.languages.map((lang) => (
                    <span
                      key={lang}
                      className="rounded-full px-2.5 py-0.5 text-xs"
                      style={{
                        background: "rgba(201,176,55,0.08)",
                        color: "#aaa",
                        border: "1px solid rgba(201,176,55,0.15)",
                      }}
                    >
                      {lang}
                    </span>
                  ))}
                </div>

                {/* Bio */}
                {t.bio && (
                  <p
                    className="text-sm line-clamp-2 mb-5 flex-1"
                    style={{ color: "#bbb" }}
                  >
                    {t.bio}
                  </p>
                )}

                {/* Rate */}
                <p className="text-2xl font-bold mb-5" style={{ color: "#ffd700" }}>
                  ${(t.session_rate_cents / 100).toFixed(0)}
                  <span className="text-sm font-normal ml-1" style={{ color: "#999" }}>
                    /session
                  </span>
                </p>

                {/* CTAs */}
                <div className="flex gap-3 mt-auto">
                  <Link
                    href={`/therapists/${t.slug}`}
                    className="flex-1 rounded-full px-4 py-3 text-sm font-semibold text-center transition-all"
                    style={{
                      border: "2px solid #c9b037",
                      color: "#c9b037",
                      background: "transparent",
                    }}
                  >
                    View Profile
                  </Link>
                  <Link
                    href={`/book?therapist=${t.slug}`}
                    className="flex-1 rounded-full px-4 py-3 text-sm font-bold text-center transition-all"
                    style={{
                      background: "linear-gradient(135deg, #c9b037, #ffd700, #f4d03f)",
                      color: "#1a1a1a",
                      boxShadow: "0 8px 25px rgba(201,176,55,0.4)",
                    }}
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* All therapists CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/therapist-page-clone"
            className="inline-flex items-center gap-2 rounded-full border-2 px-8 py-3 text-base font-semibold transition-colors"
            style={{ borderColor: "#c9b037", color: "#c9b037", background: "#1a1a1a" }}
          >
            See All Therapists
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Testimonials
// ─────────────────────────────────────────────────────────────

function Testimonials() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: "#0a0a0a" }}>
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{
              fontFamily: "'Outfit', sans-serif",
              background: "linear-gradient(135deg, #c9b037, #ffd700, #f4d03f)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Stories from the diaspora
          </h2>
          <p className="text-lg" style={{ color: "#999" }}>
            Real experiences from NRIs who found their footing.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="rounded-2xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "#1a1a1a",
                border: "1px solid rgba(201,176,55,0.3)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}
            >
              {/* Gold quote mark */}
              <div className="text-4xl mb-3" style={{ color: "#c9b037" }}>&ldquo;</div>
              <blockquote className="flex-1 leading-relaxed mb-6" style={{ color: "#e8e8e8" }}>
                {t.quote}
              </blockquote>
              <figcaption className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
                  style={{
                    background: "rgba(201,176,55,0.15)",
                    border: "2px solid #c9b037",
                    color: "#c9b037",
                  }}
                >
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "#ffffff" }}>
                    {t.name}
                  </div>
                  <div className="text-xs" style={{ color: "#999" }}>{t.location}</div>
                </div>
                <div className="ml-auto" style={{ color: "#c9b037" }}>{"★".repeat(5)}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────

function FAQ() {
  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8"
      style={{ background: "#111111" }}
    >
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-14">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{
              fontFamily: "'Outfit', sans-serif",
              background: "linear-gradient(135deg, #c9b037, #ffd700, #f4d03f)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Frequently asked questions
          </h2>
          <p className="text-lg" style={{ color: "#999" }}>
            Everything you need to know before your first session.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl"
              style={{
                background: "#1a1a1a",
                border: "1px solid rgba(201,176,55,0.3)",
              }}
            >
              <summary
                className="flex cursor-pointer items-center justify-between p-6 text-left font-semibold transition-colors [&::-webkit-details-marker]:hidden list-none"
                style={{ color: "#ffffff" }}
              >
                <span>{faq.q}</span>
                <svg
                  className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180"
                  style={{ color: "#c9b037" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 leading-relaxed" style={{ color: "#bbb" }}>
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="px-4 py-16 sm:px-6 lg:px-8" style={{ background: "#0a0a0a" }}>
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <p
              className="text-xl font-semibold mb-3"
              style={{
                background: "linear-gradient(135deg, #c9b037, #ffd700)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              India Therapist
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#999" }}>
              Therapy for NRIs, by therapists who understand your world.
            </p>
          </div>

          {/* Therapists */}
          <div>
            <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider" style={{ color: "#c9b037" }}>
              Therapists
            </h4>
            <ul className="space-y-2.5 text-sm" style={{ color: "#999" }}>
              {["Find a Therapist", "Anxiety & Stress", "Relationships", "Family Therapy", "Grief & Loss"].map((l) => (
                <li key={l}>
                  <Link href="/therapists" className="hover:text-[#c9b037] transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider" style={{ color: "#c9b037" }}>
              Company
            </h4>
            <ul className="space-y-2.5 text-sm" style={{ color: "#999" }}>
              <li><Link href="/about" className="hover:text-[#c9b037] transition-colors">About Us</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-[#c9b037] transition-colors">How It Works</Link></li>
              <li><a href="https://blogs.indiatherapist.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#c9b037] transition-colors">Blog</a></li>
              <li><Link href="/therapists" className="hover:text-[#c9b037] transition-colors">For Therapists</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider" style={{ color: "#c9b037" }}>
              Legal
            </h4>
            <ul className="space-y-2.5 text-sm" style={{ color: "#999" }}>
              <li><Link href="/privacy" className="hover:text-[#c9b037] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-[#c9b037] transition-colors">Terms of Service</Link></li>
              <li><Link href="/terms" className="hover:text-[#c9b037] transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ borderColor: "rgba(201,176,55,0.2)" }}>
          <p className="text-sm" style={{ color: "#999" }}>
            © 2026 India Therapist. All rights reserved.
          </p>
          <p className="text-xs max-w-md leading-relaxed" style={{ color: "#666" }}>
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

export default async function HomepageClone() {
  return (
    <>
      {/* Shimmer animation for cards */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}} />
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
        <TherapistsPreviewSection />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
