import Link from "next/link";
import Navbar from "@/components/Navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — India Therapist",
  description:
    "India Therapist is the only dedicated online therapy platform for NRIs worldwide. Learn about our mission, our therapists, and why we exist.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-[#F8F5FF] via-[#F0EBFF] to-[#E0D5FF] py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1
              className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Therapy that understands{" "}
              <span className="text-[#7B5FB8] italic">where you come from</span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
              India Therapist exists because no NRI should have to explain what
              &ldquo;log kya kahenge&rdquo; means before they can talk about
              what&apos;s really going on.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-16 md:grid-cols-2 items-center">
              <div>
                <h2
                  className="text-3xl font-bold text-gray-900 mb-6"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  Our Mission
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We believe every NRI deserves mental health support from
                  someone who truly understands their world — the guilt of
                  missing festivals back home, the loneliness of building a life
                  in a foreign country, and the invisible weight of living
                  between two cultures.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  India Therapist connects you with experienced, licensed Indian
                  therapists who speak your language, understand your culture,
                  and are available across every time zone — all at a fraction of
                  what Western therapy costs.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { number: "26+", label: "Licensed therapists" },
                  { number: "12", label: "Languages supported" },
                  { number: "14+", label: "Countries served" },
                  { number: "10–22", label: "Years avg. experience" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl bg-[#F8F5FF] p-6 text-center"
                  >
                    <div className="text-2xl font-bold text-[#7B5FB8]">
                      {stat.number}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Why We Exist */}
        <section className="bg-[#F8F5FF] py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2
              className="text-3xl font-bold text-gray-900 mb-8 text-center"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Why We Exist
            </h2>
            <div className="space-y-6 text-gray-600 leading-relaxed">
              <p>
                Moving abroad changes everything — your identity, your
                relationships, your sense of belonging. Yet when NRIs seek
                therapy in their adopted countries, they often face therapists
                who don&apos;t understand arranged marriages, joint family
                dynamics, the H-1B tightrope, or why &ldquo;just set
                boundaries&rdquo; doesn&apos;t work with Indian parents.
              </p>
              <p>
                We founded India Therapist to close that gap. Every therapist on
                our platform grew up in India, trained professionally, and
                specializes in the unique challenges the Indian diaspora faces.
                They speak your language — literally and figuratively.
              </p>
              <p>
                Whether you&apos;re a tech worker in Silicon Valley dealing with
                burnout, a student in London struggling with homesickness, or a
                family in Dubai navigating cross-cultural parenting — we&apos;re
                here for you.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2
              className="text-3xl font-bold text-gray-900 mb-12 text-center"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              What We Stand For
            </h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {values.map((v) => (
                <div key={v.title} className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F8F5FF] text-3xl">
                    {v.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {v.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {v.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#7B5FB8] py-16 px-4 sm:px-6 lg:px-8 text-center">
          <div className="mx-auto max-w-2xl">
            <h2
              className="text-3xl font-bold text-white mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Ready to talk to someone who gets it?
            </h2>
            <p className="text-[#C4B5F0] mb-8">
              Your first session is risk-free. If it&apos;s not the right fit,
              you get a full refund.
            </p>
            <Link
              href="/therapists"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-[#7B5FB8] shadow-lg hover:bg-gray-50 transition-all hover:-translate-y-0.5"
            >
              Find Your Therapist →
            </Link>
          </div>
        </section>
      </main>

      {/* Simple footer */}
      <footer className="bg-[#7B5FB8] text-[#C4B5F0] text-center py-8 px-4 text-sm border-t border-white/10">
        © 2026 India Therapist. All rights reserved.
      </footer>
    </>
  );
}

const values = [
  {
    icon: "🤝",
    title: "Cultural Empathy First",
    body: "Every therapist understands Indian family dynamics, diaspora guilt, and the immigrant experience from the inside.",
  },
  {
    icon: "🔒",
    title: "Complete Confidentiality",
    body: "Your sessions are private. We use end-to-end encryption and never share your information with anyone.",
  },
  {
    icon: "💰",
    title: "Radically Affordable",
    body: "$39–$141 per session — 60% less than Western therapy rates, with therapists of equal or greater experience.",
  },
  {
    icon: "🌍",
    title: "Built for Every Time Zone",
    body: "From California to Singapore, our therapists flex their schedules to fit yours — mornings, evenings, and weekends.",
  },
  {
    icon: "🗣️",
    title: "Your Language, Your Way",
    body: "Sessions available in Hindi, Tamil, Telugu, Gujarati, Marathi, Kannada, Malayalam, Punjabi, Bengali, Urdu, and English.",
  },
  {
    icon: "✅",
    title: "Risk-Free Promise",
    body: "Not the right fit? Full refund after your first session, no questions asked. We want this to work for you.",
  },
];
