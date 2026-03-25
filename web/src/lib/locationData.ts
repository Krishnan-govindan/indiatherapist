export interface LocationChallenge {
  title: string;
  detail: string;
}

export interface LocationFaq {
  q: string;
  a: string;
}

export interface LocationData {
  pageSlug: string;
  displayName: string;
  type: "country" | "language";
  population: string;
  timezoneNote: string;
  primaryLanguages: string[];
  specificChallenges: LocationChallenge[];
  faq: LocationFaq[];
}

export const LOCATIONS: LocationData[] = [
  {
    pageSlug: "nri-therapist-australia",
    displayName: "Australia",
    type: "country",
    population: "700,000+ Indian immigrants",
    timezoneNote:
      "AEST/AEDT is IST + 4.5–5.5 hours. Morning IST sessions align with Australian afternoon hours — easy to attend after work or during a late lunch.",
    primaryLanguages: ["Hindi", "Tamil", "Telugu", "Gujarati", "Punjabi"],
    specificChallenges: [
      {
        title: "PR visa and 189/190/491 visa anxiety",
        detail:
          "The points-based PR system creates years of uncertainty. Our therapists understand the stress of waiting, meeting score thresholds, and not knowing if Australia will be your permanent home.",
      },
      {
        title: "Isolation in suburbs far from Indian communities",
        detail:
          "India's dense social fabric is hard to replicate in sprawling Australian suburbs. Many NRIs describe feeling invisible — surrounded by people but deeply alone.",
      },
      {
        title: "Children losing Indian cultural identity",
        detail:
          "Raising children between two cultures creates ongoing conflict: maintaining Indian values and language while helping kids fit into Australian society.",
      },
      {
        title: "Workplace discrimination and being overlooked",
        detail:
          "Many Indian professionals in Australia report being passed over for promotions or feeling their communication style is subtly penalised in Australian workplaces.",
      },
      {
        title: "Partner visa delays and family separation",
        detail:
          "With processing times stretching 12–24 months, partner visa waiting periods mean months or years apart from spouses and children.",
      },
    ],
    faq: [
      {
        q: "What time zone works for therapy sessions for NRIs in Australia?",
        a: "Australia (AEST) is IST + 4.5–5.5 hours. Morning IST sessions (8–10am IST) fall in the early-to-mid afternoon in Sydney and Melbourne — easy to attend after work or during a lunch break.",
      },
      {
        q: "How much does online therapy cost compared to local therapists in Australia?",
        a: "Australian therapists typically charge AUD $150–$300 per session. India Therapist sessions start from $39 USD — that's 60–80% less, with therapists who are equally qualified and culturally far more relevant to your NRI experience.",
      },
      {
        q: "Do India Therapist therapists understand Australian NRI challenges?",
        a: "Yes. Our therapists work with NRIs from Australia regularly and understand PR visa stress, isolation in suburban Australia, multicultural parenting, and workplace dynamics unique to the Indian experience there.",
      },
      {
        q: "Which Indian languages are available for therapy in Australia?",
        a: "We have therapists available in Hindi, Tamil, Telugu, Gujarati, Marathi, Punjabi, Kannada, and Malayalam — covering the primary Indian communities in Sydney, Melbourne, Brisbane, and beyond.",
      },
    ],
  },

  {
    pageSlug: "nri-therapist-usa",
    displayName: "United States",
    type: "country",
    population: "4.4 million Indian Americans",
    timezoneNote:
      "EST is IST − 10.5 hours; PST is IST − 13.5 hours. Evening IST sessions (7–10pm IST) correspond to US morning slots — perfect before or after work.",
    primaryLanguages: ["Hindi", "Gujarati", "Telugu", "Tamil", "Punjabi"],
    specificChallenges: [
      {
        title: "H-1B visa uncertainty and renewal anxiety",
        detail:
          "A layoff is not just a career setback — it's a potential life upheaval. The dependency between your visa and your employer creates uniquely compounded stress that few Western therapists truly grasp.",
      },
      {
        title: "Green card wait times (10–25 years for EB-2/EB-3 India)",
        detail:
          "Living in limbo for a decade or more — unable to change jobs freely, unable to plan a future — is a specific form of prolonged stress that our therapists specialise in.",
      },
      {
        title: "Tech industry layoffs affecting visa status",
        detail:
          "The wave of tech layoffs hit Indian H-1B holders disproportionately hard. The 60-day grace period, the job search panic, the immigration consequences — our therapists have seen this and know how to help.",
      },
      {
        title: "Silicon Valley performance culture and imposter syndrome",
        detail:
          "The pressure to succeed in American tech, combined with first-generation immigrant identity, creates a particularly crushing form of imposter syndrome that Indian-cultural therapy addresses directly.",
      },
      {
        title: "Long-distance family relationships and eldercare guilt",
        detail:
          "Not being present for ageing parents — missing milestones, managing healthcare from thousands of miles away — carries a heavy emotional weight that our therapists understand from the inside.",
      },
    ],
    faq: [
      {
        q: "What time zone works for therapy sessions for NRIs in the US?",
        a: "East Coast NRIs: 8–10am EST = 7–9:30pm IST — manageable for India-based therapists. West Coast: 6–9am PST = 7:30–10:30pm IST. We find time slots that work for your timezone.",
      },
      {
        q: "How much does online therapy cost compared to US therapists?",
        a: "American therapists typically charge $150–$300 per session, rarely covered by insurance for culturally matched care. India Therapist sessions start at $39 — qualified Indian therapists at a fraction of the US price.",
      },
      {
        q: "Can India Therapist help with H-1B visa anxiety and layoff stress?",
        a: "Absolutely. This is one of our most common presenting issues. Our therapists understand the compounded stress of visa-dependent employment — the fear isn't irrational, and they won't treat it as such.",
      },
      {
        q: "Are sessions in Hindi, Gujarati, or Telugu available for US-based NRIs?",
        a: "Yes. We have therapists fluent in Hindi, Gujarati, Telugu, Tamil, Marathi, Punjabi, Kannada, and more. Many US clients specifically seek therapy in their mother tongue — emotions expressed in Hindi or Telugu often feel more authentic than in English.",
      },
    ],
  },

  {
    pageSlug: "nri-therapist-canada",
    displayName: "Canada",
    type: "country",
    population: "1.8 million Indian Canadians",
    timezoneNote:
      "EST/CST is IST − 10.5–12.5 hours. Evening IST sessions align with Canadian mornings — early morning sessions in Toronto or Vancouver before your workday starts.",
    primaryLanguages: ["Punjabi", "Hindi", "Gujarati", "Tamil"],
    specificChallenges: [
      {
        title: "Canadian PR process stress (Express Entry, PNP)",
        detail:
          "The points-based system and uncertain wait times create a 'holding pattern' feeling — unable to fully commit to building a life in Canada until PR is confirmed.",
      },
      {
        title: "Harsh winters and seasonal affective disorder",
        detail:
          "Coming from India's climate to Canadian winters is a significant adjustment. Seasonal mood changes combined with NRI isolation compound into serious and often unaddressed mental health challenges.",
      },
      {
        title: "Settlement challenges in Toronto, Vancouver, Calgary",
        detail:
          "Despite large Indian communities, many new immigrants feel isolated. The emphasis on 'Canadian experience' in the job market is deeply frustrating for skilled Indian professionals.",
      },
      {
        title: "Punjabi diaspora family and community pressure",
        detail:
          "The large Punjabi community creates both support and pressure — community expectations, izzat, marriage timelines, and the weight of family reputation weigh heavily on many Indian Canadians.",
      },
      {
        title: "Credential recognition struggles",
        detail:
          "Doctors, engineers, and other professionals often spend years getting Indian qualifications recognised in Canada. The professional identity loss during this period is significant and often unspoken.",
      },
    ],
    faq: [
      {
        q: "What time zone works for therapy sessions for NRIs in Canada?",
        a: "Evening IST sessions (6:30–10pm IST) correspond to morning slots in Canada (7–11:30am EST, 4–8:30am PST). Many Indian Canadians book early morning sessions before their workday. We schedule around your timezone.",
      },
      {
        q: "How much does online therapy cost compared to Canadian therapists?",
        a: "Canadian psychologists typically charge CAD $150–$250 per session. India Therapist sessions start at $39 USD — significantly more affordable, with therapists who deeply understand the Indian-Canadian experience.",
      },
      {
        q: "Do you have Punjabi-speaking therapists for Indian-Canadians?",
        a: "Yes, we have therapists fluent in Punjabi, Hindi, Gujarati, and Tamil. Our Punjabi-speaking therapists are experienced with the pressures of the large Punjabi community in Canada specifically.",
      },
      {
        q: "Can therapy help with Canadian PR and Express Entry anxiety?",
        a: "Yes. The anxiety of the PR waiting period — the uncertainty, the limited freedom, the fear of rejection — is a real and serious stressor. Our therapists work with this regularly and won't minimise it.",
      },
    ],
  },

  {
    pageSlug: "nri-therapist-uk",
    displayName: "United Kingdom",
    type: "country",
    population: "1.8 million British Indians",
    timezoneNote:
      "GMT/BST is IST − 5.5 hours. UK afternoons (2–5pm GMT) align with IST evenings (7:30–10:30pm) — a convenient slot for both sides.",
    primaryLanguages: ["Hindi", "Gujarati", "Punjabi", "Tamil"],
    specificChallenges: [
      {
        title: "Post-Brexit immigration and Skilled Worker visa pressure",
        detail:
          "Brexit changed the landscape for Indians in the UK. Visa rules, salary thresholds, and the path to Indefinite Leave to Remain (ILR) create ongoing legal and financial stress.",
      },
      {
        title: "NHS mental health waitlists stretching 12–18 months",
        detail:
          "Many British Indians struggle in silence because NHS therapy waitlists are impossibly long and private therapy at £80–£150/session is financially out of reach. India Therapist offers an immediate, affordable alternative.",
      },
      {
        title: "Generational cultural identity conflicts",
        detail:
          "Third and fourth generation British Indians navigate a complex identity — 'too British' for family in India, 'too Indian' for full acceptance in British society.",
      },
      {
        title: "Racism and microaggressions in British workplaces",
        detail:
          "Many Indian professionals in the UK report subtle and overt discrimination. Processing these experiences with a culturally matched therapist is validating in a way Western therapy often isn't.",
      },
      {
        title: "Marriage pressure and dating in a Western context",
        detail:
          "Navigating British dating culture while managing family expectations around arranged marriage creates uniquely stressful situations — ones our therapists understand from the inside.",
      },
    ],
    faq: [
      {
        q: "What time zone works best for therapy sessions for NRIs in the UK?",
        a: "UK afternoons (2–5pm GMT/BST) align with IST evenings (7:30–10:30pm) — ideal for after-work sessions on both sides. Early morning UK sessions (7–9am) also work for those who prefer before-work appointments.",
      },
      {
        q: "How much does online therapy cost compared to UK therapists?",
        a: "UK therapists typically charge £80–£150 per session. India Therapist sessions start at $39 USD (~£31) — 60–70% less, with therapists who understand British-Indian cultural dynamics specifically.",
      },
      {
        q: "Is India Therapist an alternative to NHS therapy for British Indians?",
        a: "For many British Indians, yes. NHS waitlists can be 12–18 months. India Therapist connects you with a qualified Indian therapist within days — sessions are private, confidential, and far more culturally relevant.",
      },
      {
        q: "Do your therapists understand the British-Indian experience?",
        a: "Our therapists work with NRIs in the UK regularly and understand the specific tensions of British-Indian identity — from Skilled Worker visa stress to family marriage pressure to navigating British workplace culture.",
      },
    ],
  },

  {
    pageSlug: "nri-therapist-singapore",
    displayName: "Singapore",
    type: "country",
    population: "350,000 Indians in Singapore",
    timezoneNote:
      "SGT is IST + 2.5 hours — the best timezone overlap of any NRI hub. Morning IST sessions (9–11am) fall at 11:30am–1:30pm SGT, perfect for a lunch break.",
    primaryLanguages: ["Tamil", "Hindi", "Telugu", "Kannada", "Malayalam"],
    specificChallenges: [
      {
        title: "EP/S-Pass employment visa anxiety",
        detail:
          "Singapore's Employment Pass and S-Pass are tied entirely to your employer. Any hint of job insecurity creates cascading immigration anxiety that our therapists understand well.",
      },
      {
        title: "High cost of living and financial pressure",
        detail:
          "Singapore's cost of living places enormous pressure on Indian expats — housing, childcare, and lifestyle expenses mean financial anxiety is constant background noise.",
      },
      {
        title: "Small island isolation from extended family",
        detail:
          "Despite Singapore's cosmopolitan feel, many Indian expats describe a particular loneliness — far from family, in a city where social networks are transient and superficial.",
      },
      {
        title: "Intense work performance culture",
        detail:
          "Singapore's competitive environment and long hours culture is psychologically exhausting, particularly for Indian professionals navigating high-pressure multinational environments.",
      },
    ],
    faq: [
      {
        q: "What time zone do therapy sessions work for NRIs in Singapore?",
        a: "Singapore (SGT) is only 2.5 hours ahead of IST — the most convenient timezone for Indian therapists. Sessions at 9–11am IST fall at 11:30am–1:30pm SGT. Many clients attend during lunch breaks.",
      },
      {
        q: "How much does online therapy cost compared to Singapore therapists?",
        a: "Private therapy in Singapore typically costs SGD $150–$300 per session. India Therapist sessions start at $39 USD — qualified Indian therapists at a fraction of the Singapore price.",
      },
      {
        q: "Do you have Tamil-speaking therapists for the Indian community in Singapore?",
        a: "Yes. Tamil-speaking therapists are well represented in our network. We also have therapists fluent in Hindi, Telugu, Kannada, and Malayalam for the broader Indian community in Singapore.",
      },
      {
        q: "Can therapy help with EP/S-Pass job anxiety in Singapore?",
        a: "Absolutely. The precarity of employer-tied visas is a real and serious stressor. Our therapists specialise in visa-linked anxiety and understand the specific pressures of working in Singapore's high-performance environment.",
      },
    ],
  },

  {
    pageSlug: "nri-therapist-uae",
    displayName: "UAE",
    type: "country",
    population: "3.5 million Indians in UAE",
    timezoneNote:
      "GST is IST + 1.5 hours — the most seamless overlap of any NRI location. Sessions at 9am IST fall at 10:30am in Dubai and Abu Dhabi.",
    primaryLanguages: ["Hindi", "Gujarati", "Malayalam", "Tamil", "Telugu"],
    specificChallenges: [
      {
        title: "Employer-dependent visa and job insecurity",
        detail:
          "In the UAE, your visa is tied to your employer. Losing a job means losing your legal right to stay — a level of precarity that creates constant background stress for Indian workers.",
      },
      {
        title: "Family separation and remittance pressure",
        detail:
          "Many Indian workers in the UAE live apart from their spouses and children for years, sending money home while managing loneliness and missing major family milestones.",
      },
      {
        title: "Financial pressure and debt from migration costs",
        detail:
          "The cost of migration and establishing oneself in the UAE often means carrying significant debt — adding financial anxiety to the already challenging adjustment period.",
      },
      {
        title: "Limited local mental health resources and social stigma",
        detail:
          "Mental health services in the UAE are limited and expensive. Social stigma within Indian communities in the Gulf adds another barrier to seeking help.",
      },
    ],
    faq: [
      {
        q: "What time zone works for therapy sessions for Indians in the UAE?",
        a: "UAE (GST) is just 1.5 hours ahead of IST — the easiest timezone for Indian therapists. A 9am IST session falls at 10:30am in Dubai. Sessions are easy to fit around your workday.",
      },
      {
        q: "How much does online therapy cost compared to UAE therapists?",
        a: "Private therapy in Dubai or Abu Dhabi typically costs AED 400–800 per session (USD $110–$218). India Therapist sessions start at $39 — making quality therapy genuinely accessible for Indians across the Gulf.",
      },
      {
        q: "Is therapy confidential for Indians in the UAE?",
        a: "Yes, completely. All sessions are private, encrypted video calls. Your employer, family, or community will have no way of knowing you are in therapy. Confidentiality is fully protected.",
      },
      {
        q: "Which Indian languages are available for therapy in the UAE?",
        a: "We have therapists available in Hindi, Gujarati, Malayalam, Tamil, Telugu, Marathi, and more — covering the full spectrum of India's communities working across Dubai, Abu Dhabi, and the broader UAE.",
      },
    ],
  },

  {
    pageSlug: "hindi-therapist-online",
    displayName: "Hindi-Speaking NRIs",
    type: "language",
    population: "50+ million Hindi speakers worldwide",
    timezoneNote:
      "Hindi-speaking NRIs live across USA, UK, Canada, Australia, UAE, and more. Our Hindi therapists are available across overlapping time zones to match your location.",
    primaryLanguages: ["Hindi"],
    specificChallenges: [
      {
        title: "Finding therapists who understand Hindi cultural concepts",
        detail:
          "Concepts like izzat (honour), sharam (shame), and parivar (family obligation) don't translate easily into English therapy. A Hindi-speaking therapist already understands what you mean — no explanation needed.",
      },
      {
        title: "Expressing emotions naturally in the language you feel them",
        detail:
          "Research shows people process emotions more authentically in their mother tongue. For Hindi speakers, therapy in English often feels performative; therapy in Hindi feels real and unfiltered.",
      },
      {
        title: "NRI-specific Hindi community pressures",
        detail:
          "Whether it's the North Indian joint family structure, marriage expectations, or social dynamics of Hindi-speaking communities abroad — our therapists understand the ecosystem without briefing.",
      },
      {
        title: "Navigating professional life in a non-Hindi-speaking country",
        detail:
          "The cognitive and emotional load of operating in a second language all day is real. Switching to Hindi in therapy sessions offers genuine relief and deeper access to your inner experience.",
      },
    ],
    faq: [
      {
        q: "Are therapy sessions conducted fully in Hindi?",
        a: "Yes. Sessions with our Hindi-speaking therapists are conducted entirely in Hindi — no need to translate your emotions. You can speak in whichever dialect feels most natural: Hindustani, Khari Boli, or Hinglish.",
      },
      {
        q: "Do Hindi therapists understand NRI-specific cultural dynamics?",
        a: "Yes. Our Hindi-speaking therapists work with NRIs from the USA, UK, Canada, Australia, and the Gulf regularly. They understand concepts like izzat, joint family pressure, and the tensions of being Indian abroad.",
      },
      {
        q: "How much do Hindi therapy sessions cost?",
        a: "Sessions range from $39 to $141 per 60-minute session depending on the therapist's experience. That's far more affordable than English-language therapy in the US, UK, or Canada.",
      },
      {
        q: "Where are your Hindi-speaking therapists based?",
        a: "Our therapists are India-based, fully immersed in Hindi language and culture. Sessions are conducted online via secure video call — accessible from anywhere in the world.",
      },
    ],
  },

  {
    pageSlug: "tamil-therapist-online",
    displayName: "Tamil-Speaking NRIs",
    type: "language",
    population: "8+ million Tamil diaspora worldwide",
    timezoneNote:
      "Tamil-speaking NRIs live primarily in Singapore, Malaysia, UK, USA, Canada, and Australia. Our Tamil therapists are available across all these time zones.",
    primaryLanguages: ["Tamil"],
    specificChallenges: [
      {
        title: "Tamil community reputation (manam) and social pressure",
        detail:
          "In Tamil culture, community reputation — what people will say, what your family will think — is deeply ingrained. A Tamil therapist understands manam without you needing to explain it.",
      },
      {
        title: "Tamil expat communities in Singapore, Malaysia, UK, and USA",
        detail:
          "The specific pressures of the Singaporean Tamil community, the Malaysian Indian diaspora, or Tamil professionals in the UK or USA are each unique — our therapists understand these distinctions.",
      },
      {
        title: "Marriage expectations and family pressure in Tamil culture",
        detail:
          "Age-based marriage pressure, caste considerations, and the expectation of parental approval in relationships are significant stressors for Tamil NRIs — especially for women navigating both worlds.",
      },
      {
        title: "Academic and professional overachievement pressure",
        detail:
          "Tamil families' emphasis on academic excellence creates particular pressure. The fear of 'not being enough' despite significant achievement is a common theme our therapists work with.",
      },
    ],
    faq: [
      {
        q: "Are sessions conducted in Tamil?",
        a: "Yes — sessions are fully in Tamil. Our therapists understand both classical Tamil expressions of emotion and modern spoken Tamil equally, including the Tanglish (Tamil-English) blend many diaspora speakers use.",
      },
      {
        q: "Do Tamil therapists understand the Tamil diaspora experience?",
        a: "Yes. Our Tamil-speaking therapists work with NRIs from Singapore, Malaysia, UK, USA, and Canada regularly. They understand manam, Tamil family dynamics, and the Tamil diaspora's specific identity pressures.",
      },
      {
        q: "How much do Tamil therapy sessions cost?",
        a: "Sessions range from $39 to $141 per 60-minute session. For Tamil NRIs in Singapore where local therapy costs SGD $150–$300, this represents significant savings with culturally superior care.",
      },
      {
        q: "Are Tamil therapists available for NRIs in Singapore and Malaysia?",
        a: "Yes. Singapore (SGT) and Malaysia (MYT) are only 2–2.5 hours ahead of IST, making scheduling very convenient. Lunch-break sessions are popular with Tamil NRIs in Singapore.",
      },
    ],
  },

  {
    pageSlug: "telugu-therapist-online",
    displayName: "Telugu-Speaking NRIs",
    type: "language",
    population: "3+ million Telugu diaspora worldwide",
    timezoneNote:
      "Telugu-speaking NRIs are concentrated in the USA (Silicon Valley, Texas), UK, and Australia. Our Telugu therapists cover all these time zones.",
    primaryLanguages: ["Telugu"],
    specificChallenges: [
      {
        title: "Telugu NRI concentration in US tech (Silicon Valley, Texas)",
        detail:
          "Telugu professionals are among the largest groups of Indian H-1B workers in US tech. H-1B anxiety, layoff stress, and Green Card wait times hit the Telugu community particularly hard.",
      },
      {
        title: "Marriage and family expectations in Telugu culture",
        detail:
          "Family-arranged marriage timelines, caste expectations, and pressure around starting a family soon after marriage are common stressors for Telugu NRIs navigating life abroad.",
      },
      {
        title: "Cultural identity between Telugu tradition and life abroad",
        detail:
          "Maintaining connection to Telugu language, culture, and values while living in a Western country creates a genuine identity tension — one a Telugu therapist intuitively understands.",
      },
      {
        title: "Long-distance family relationships and eldercare from abroad",
        detail:
          "Not being present for parents' health challenges, festivals, and milestones — and the guilt that accompanies it — is a specific emotional burden many Telugu NRIs carry silently.",
      },
    ],
    faq: [
      {
        q: "Are sessions conducted in Telugu?",
        a: "Yes, fully in Telugu. Our therapists are native Telugu speakers who understand both formal Telugu and the Tenglish (Telugu-English) blend commonly used by the diaspora.",
      },
      {
        q: "Do Telugu therapists understand the US tech NRI experience?",
        a: "Yes. With Telugu professionals being one of the largest H-1B groups in US tech, our Telugu therapists are very familiar with visa anxiety, layoff stress, and Silicon Valley performance pressures.",
      },
      {
        q: "How much do Telugu therapy sessions cost?",
        a: "Sessions range from $39 to $141 per 60-minute session — a fraction of US therapist rates ($150–$300), with a therapist who speaks your language and understands your cultural context.",
      },
      {
        q: "Are Telugu therapists available for NRIs in Australia and the UK?",
        a: "Yes. We have Telugu-speaking therapists whose schedules cover Australian and UK time zones. Whether you're in Sydney, Melbourne, London, or Birmingham, sessions are accessible and convenient.",
      },
    ],
  },
];

export const LOCATION_MAP: Record<string, LocationData> = Object.fromEntries(
  LOCATIONS.map((loc) => [loc.pageSlug, loc])
);
