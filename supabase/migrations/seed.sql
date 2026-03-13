-- Seed: seed.sql
-- Sample therapists for development and staging environments

INSERT INTO therapists (
  full_name,
  slug,
  tier,
  session_rate_cents,
  specialties,
  languages,
  therapy_types,
  bio,
  photo_url,
  education,
  experience_years,
  city,
  country,
  timezone,
  whatsapp_number,
  email,
  is_active,
  max_sessions_per_day,
  stripe_connect_id
) VALUES

-- Therapist 1: Anxiety specialist, Hindi + English
(
  'Dr. Priya Sharma',
  'dr-priya-sharma',
  'premium',
  9700,
  ARRAY['anxiety', 'stress management', 'panic disorder', 'OCD'],
  ARRAY['Hindi', 'English'],
  ARRAY['CBT', 'Mindfulness-Based Therapy', 'Exposure Therapy'],
  'Dr. Priya Sharma is a Delhi-based psychologist with over 10 years of experience helping clients overcome anxiety, panic, and stress. She uses evidence-based CBT and mindfulness techniques tailored to the Indian cultural context.',
  NULL,
  'M.Phil Clinical Psychology, NIMHANS Bangalore; PhD Psychology, Delhi University',
  10,
  'New Delhi',
  'India',
  'Asia/Kolkata',
  '+91XXXXXXXXXX',
  'priya.sharma@placeholder.indiatherapist.com',
  TRUE,
  6,
  NULL
),

-- Therapist 2: Relationship counsellor, Tamil + English
(
  'Kavitha Rajan',
  'kavitha-rajan',
  'premium',
  9700,
  ARRAY['relationships', 'couples therapy', 'pre-marital counselling', 'divorce adjustment', 'infidelity'],
  ARRAY['Tamil', 'English'],
  ARRAY['Emotionally Focused Therapy', 'Gottman Method', 'Narrative Therapy'],
  'Kavitha Rajan is a Chennai-based relationship therapist who specialises in helping couples and individuals navigate the complexities of modern relationships. She brings warmth, cultural sensitivity, and a non-judgmental approach to every session.',
  NULL,
  'MA Counselling Psychology, Madras University; Certified Gottman Therapist (Level 2)',
  8,
  'Chennai',
  'India',
  'Asia/Kolkata',
  '+91XXXXXXXXXX',
  'kavitha.rajan@placeholder.indiatherapist.com',
  TRUE,
  6,
  NULL
),

-- Therapist 3: Family therapist, Hindi + English + Marathi
(
  'Rahul Deshmukh',
  'rahul-deshmukh',
  'premium',
  9700,
  ARRAY['family therapy', 'parent-child conflict', 'adolescent issues', 'grief', 'life transitions'],
  ARRAY['Hindi', 'English', 'Marathi'],
  ARRAY['Systemic Family Therapy', 'Solution-Focused Brief Therapy', 'Grief Counselling'],
  'Rahul Deshmukh is a Pune-based family therapist with a decade of experience working with families, adolescents, and individuals facing major life transitions. He is known for his practical, solution-focused approach that respects family dynamics and Indian values.',
  NULL,
  'MSc Applied Psychology, Pune University; Diploma in Family Therapy, TISS Mumbai',
  10,
  'Pune',
  'India',
  'Asia/Kolkata',
  '+91XXXXXXXXXX',
  'rahul.deshmukh@placeholder.indiatherapist.com',
  TRUE,
  6,
  NULL
);
