import Link from "next/link";

interface TherapistData {
  id: string;
  full_name: string;
  slug: string;
  tier: string;
  session_rate_cents: number;
  specialties: string[];
  languages: string[];
  experience_years: number | null;
  photo_url: string | null;
  bio: string | null;
}

// Fallback data matching the seed therapists
const FALLBACK_THERAPISTS: TherapistData[] = [
  {
    id: "1",
    full_name: "Dr. Priya Sharma",
    slug: "dr-priya-sharma",
    tier: "premium",
    session_rate_cents: 9700,
    specialties: ["Anxiety", "Stress Management", "OCD"],
    languages: ["Hindi", "English"],
    experience_years: 10,
    photo_url: null,
    bio: "Delhi-based psychologist helping clients overcome anxiety using evidence-based CBT and mindfulness.",
  },
  {
    id: "2",
    full_name: "Kavitha Rajan",
    slug: "kavitha-rajan",
    tier: "premium",
    session_rate_cents: 9700,
    specialties: ["Relationships", "Couples Therapy", "Divorce Adjustment"],
    languages: ["Tamil", "English"],
    experience_years: 8,
    photo_url: null,
    bio: "Chennai-based relationship therapist specialising in modern relationship challenges.",
  },
  {
    id: "3",
    full_name: "Rahul Deshmukh",
    slug: "rahul-deshmukh",
    tier: "premium",
    session_rate_cents: 9700,
    specialties: ["Family Therapy", "Adolescent Issues", "Grief"],
    languages: ["Hindi", "English", "Marathi"],
    experience_years: 10,
    photo_url: null,
    bio: "Pune-based family therapist with a practical, solution-focused approach.",
  },
];

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
    return FALLBACK_THERAPISTS;
  }
}

function AvatarInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
  return (
    <div className="h-20 w-20 rounded-full bg-[#1B6B6B]/10 flex items-center justify-center">
      <span className="text-2xl font-semibold text-[#1B6B6B]">{initials}</span>
    </div>
  );
}

export default async function TherapistsPreview() {
  const therapists = await fetchTherapists();

  return (
    <section className="bg-[#FFF8F0] py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Meet some of our therapists
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            All licensed, experienced, and culturally attuned to the NRI
            experience.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {therapists.map((t) => (
            <div
              key={t.id}
              className="group rounded-2xl bg-white border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-4 mb-4">
                {t.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.photo_url}
                    alt={t.full_name}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <AvatarInitials name={t.full_name} />
                )}
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                    {t.full_name}
                  </h3>
                  {t.experience_years && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {t.experience_years} years experience
                    </p>
                  )}
                  <span className="inline-block mt-1 rounded-full bg-[#1B6B6B]/10 px-2.5 py-0.5 text-xs font-medium text-[#1B6B6B] capitalize">
                    {t.tier}
                  </span>
                </div>
              </div>

              {/* Specialties */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {t.specialties.slice(0, 3).map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-[#D4A853]/15 px-2.5 py-0.5 text-xs font-medium text-[#8B6914]"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {/* Languages */}
              <p className="text-sm text-gray-500 mb-4">
                🗣️ {t.languages.join(" · ")}
              </p>

              {/* Rate + CTA */}
              <div className="mt-auto flex items-center justify-between">
                <span className="text-base font-semibold text-gray-900">
                  ${(t.session_rate_cents / 100).toFixed(0)}
                  <span className="text-sm font-normal text-gray-400">
                    /session
                  </span>
                </span>
                <Link
                  href={`/therapists/${t.slug}`}
                  className="rounded-full bg-[#1B6B6B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#134F4F] transition-colors"
                >
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* All therapists CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/therapists"
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#1B6B6B] px-8 py-3 text-base font-semibold text-[#1B6B6B] hover:bg-[#1B6B6B] hover:text-white transition-colors"
          >
            See All Therapists →
          </Link>
        </div>
      </div>
    </section>
  );
}
