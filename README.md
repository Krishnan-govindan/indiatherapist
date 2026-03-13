# India Therapist — IndiaTherapist.com

A therapy marketplace connecting clients with verified therapists across India.

## Monorepo Structure

```
/
├── web/          # Next.js 14 frontend (Vercel)
├── api/          # Node.js/Express backend (Railway)
├── supabase/     # Database migrations and seed files
└── .env.example  # Environment variable template
```

## Tech Stack

| Layer       | Technology                          | Hosting      |
|-------------|-------------------------------------|--------------|
| Frontend    | Next.js 14 (TypeScript, Tailwind)   | Vercel       |
| Backend     | Node.js / Express (TypeScript)      | Railway      |
| Database    | Supabase (PostgreSQL)               | Supabase     |
| WhatsApp    | Meta Cloud API (direct, no BSP)     | —            |
| Voice AI    | Vapi (pay-as-you-go)                | Vapi         |
| Payments    | Stripe + Stripe Connect             | Stripe       |
| Email       | Resend                              | Resend       |

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-org/indiatherapist.git
cd indiatherapist

# Install web dependencies
cd web && npm install

# Install api dependencies
cd ../api && npm install
```

### 2. Environment setup

```bash
cp .env.example .env
# Fill in all required values in .env
```

### 3. Run locally

```bash
# Terminal 1 — Next.js frontend (http://localhost:3000)
cd web && npm run dev

# Terminal 2 — Express API (http://localhost:4000)
cd api && npm run dev
```

## API Structure

```
api/src/
├── routes/      # Express route handlers
├── services/    # Business logic
├── webhooks/    # Stripe, Vapi, Meta webhook handlers
├── cron/        # Scheduled jobs
└── lib/         # Shared utilities (supabase client, etc.)
```

## Key Integrations

### WhatsApp (Meta Cloud API)
Direct integration with Meta's WhatsApp Business Cloud API — no third-party BSP required.
Set `META_WA_*` environment variables from [Meta Developer Console](https://developers.facebook.com).

### Voice AI (Vapi)
Vapi handles AI-powered voice calls for intake, scheduling, and follow-ups.
Pay-as-you-go pricing. Configure via `VAPI_*` environment variables.

### Payments (Stripe Connect)
Therapists onboard via Stripe Connect (Express accounts).
Platform takes a fee; payouts go directly to therapist bank accounts.

### AI Matching (Claude)
Uses Anthropic's Claude API to match clients with the most suitable therapists
based on specializations, availability, language, and preferences.

## Deployment

- **Frontend**: Push to `main` → Vercel auto-deploys
- **API**: Push to `main` → Railway auto-deploys
- **Database**: Run migrations via Supabase CLI: `supabase db push`
