# Deployment Guide — India Therapist

## Prerequisites
- Node.js 20+
- Supabase account
- Meta Developer account with WhatsApp Business number
- Vapi.ai account (with credits loaded)
- Stripe account
- Railway account (API hosting)
- Vercel account (web hosting)

---

## 1. SUPABASE SETUP

1. Go to [supabase.com](https://supabase.com) → New project
2. Choose a region close to your users (e.g. `ap-south-1` for India)
3. Run migrations — either:
   - **CLI:** `supabase db push` (requires `supabase` CLI and project linked)
   - **Manual:** Open SQL Editor in Supabase dashboard, paste and run each file from `api/migrations/` in order
4. Collect these values for env vars:
   - `SUPABASE_URL` — from Project Settings → API → Project URL
   - `SUPABASE_ANON_KEY` — from Project Settings → API → anon public
   - `SUPABASE_SERVICE_ROLE_KEY` — from Project Settings → API → service_role (keep secret)

---

## 2. META WHATSAPP CLOUD API SETUP

> No BSP (Business Solution Provider) needed — direct Cloud API via Meta.

1. Go to [developers.facebook.com](https://developers.facebook.com) → My Apps → Create App
2. Select **Business** type → give it a name → Create
3. On the App Dashboard, click **Add Product** → find **WhatsApp** → Set Up
4. Under WhatsApp → Getting Started, click **Connect existing number** (Embedded Signup)
   - Follow the flow to connect your existing WhatsApp Business number
5. Collect these values:
   - `META_WA_PHONE_NUMBER_ID` — shown on Getting Started page after connecting number
   - `META_WA_ACCESS_TOKEN` — generate a permanent token: Business Settings → System Users → Add → assign WhatsApp permissions → Generate Token
   - `META_WA_BUSINESS_ACCOUNT_ID` — shown in WhatsApp → Getting Started as "WhatsApp Business Account ID"
   - `META_WA_VERIFY_TOKEN` — choose any random string (e.g. `myverifytoken123`); used to verify webhook

6. **Enable Coexistence** (keep using WA Business app on your phone alongside the API):
   - WhatsApp → Configuration → Phone Numbers → select your number → **Enable Coexistence**
   - This lets you continue using the WhatsApp Business mobile app while the API sends/receives messages

7. **Submit message templates** (after API is deployed):
   ```bash
   cd api
   npx ts-node src/scripts/submitTemplates.ts
   ```
   Templates take ~24h for Meta to review and approve.

8. **Configure webhook** (after API is deployed):
   - WhatsApp → Configuration → Webhooks → Edit
   - Callback URL: `https://api.indiatherapist.com/webhooks/whatsapp`
   - Verify Token: same value as `META_WA_VERIFY_TOKEN`
   - Subscribe to: `messages`

---

## 3. VAPI SETUP

1. Log in to [vapi.ai](https://vapi.ai) with your existing account
2. Go to Assistants → Create Assistant
3. Import config from `api/vapi-agent-config.json` (if available) or configure manually
4. Collect these values:
   - `VAPI_API_KEY` — from Vapi Dashboard → Account → API Keys
   - `VAPI_AGENT_ID` — from the assistant you just created
5. Set webhook URL in Vapi Dashboard → Assistant → Server URL:
   ```
   https://api.indiatherapist.com/webhooks/vapi
   ```

---

## 4. STRIPE SETUP

1. Log in to [stripe.com](https://stripe.com) → Developers → API Keys
2. Collect:
   - `STRIPE_SECRET_KEY` — starts with `sk_live_...` (use `sk_test_...` for testing)
   - `STRIPE_PUBLISHABLE_KEY` — starts with `pk_live_...` (for web frontend)
3. Set up webhook:
   - Stripe Dashboard → Developers → Webhooks → Add endpoint
   - Endpoint URL: `https://api.indiatherapist.com/webhooks/stripe`
   - Events to listen for:
     - `payment_intent.succeeded`
     - `checkout.session.completed`
4. After saving, copy:
   - `STRIPE_WEBHOOK_SECRET` — shown on the webhook detail page (starts with `whsec_...`)

---

## 5. RAILWAY DEPLOYMENT (API)

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. From the `api/` directory: `railway init` → follow prompts to create/link a project
4. Set all environment variables:
   ```bash
   railway variables set SUPABASE_URL=https://xxx.supabase.co
   railway variables set SUPABASE_SERVICE_ROLE_KEY=your_key
   railway variables set META_WA_PHONE_NUMBER_ID=your_id
   railway variables set META_WA_ACCESS_TOKEN=your_token
   railway variables set META_WA_BUSINESS_ACCOUNT_ID=your_id
   railway variables set META_WA_VERIFY_TOKEN=your_verify_token
   railway variables set VAPI_API_KEY=your_key
   railway variables set VAPI_AGENT_ID=your_id
   railway variables set STRIPE_SECRET_KEY=sk_live_...
   railway variables set STRIPE_WEBHOOK_SECRET=whsec_...
   railway variables set ADMIN_SECRET=choose_a_strong_random_secret
   railway variables set PORT=3001
   ```
5. Deploy: `railway up`
6. Set custom domain:
   - Railway Dashboard → your service → Settings → Domains → Add custom domain
   - Add: `api.indiatherapist.com`
   - Add the CNAME record to your DNS provider as shown
7. Update Meta webhook callback URL with the Railway URL (see step 2.8 above)

---

## 6. VERCEL DEPLOYMENT (Web)

1. Install Vercel CLI: `npm install -g vercel`
2. From the `web/` directory: `vercel --prod`
   - Follow prompts to link/create a project
3. Set environment variables in Vercel Dashboard → Project → Settings → Environment Variables:
   ```
   NEXT_PUBLIC_APP_URL=https://www.indiatherapist.com
   NEXT_PUBLIC_API_URL=https://api.indiatherapist.com
   NEXT_PUBLIC_ADMIN_SECRET=same_value_as_api_ADMIN_SECRET
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```
4. Set custom domain:
   - Vercel Dashboard → Project → Settings → Domains → Add
   - Add: `www.indiatherapist.com` and `indiatherapist.com`
   - Add the DNS records shown (A record + CNAME)
5. The `web/vercel.json` rewrites will proxy `/api/*` and `/webhooks/*` to the Railway API automatically

---

## 7. POST-DEPLOYMENT CHECKS

Run these checks in order after both services are live:

- [ ] **API health:** `curl https://api.indiatherapist.com/` — should return `{"status":"ok"}`
- [ ] **Web homepage:** Visit `https://www.indiatherapist.com` — loads correctly
- [ ] **Therapist listing:** Visit `/therapists` — loads cards (may show empty if no data seeded)
- [ ] **WhatsApp webhook:** Send a message to your business WA number → check Supabase `leads` table for a new row
- [ ] **Intake form:** Submit a test lead via `/book` → check Supabase, check Vapi triggers a call
- [ ] **Stripe test payment:**
  - Use test card: `4242 4242 4242 4242`, any future expiry, any CVC
  - Confirm `payment_intent.succeeded` appears in Stripe Dashboard → Events
  - Check Supabase `appointments` table for the record
- [ ] **Admin dashboard:** Visit `/admin` → enter `ADMIN_SECRET` → confirm stats load
- [ ] **Sitemap:** Visit `https://www.indiatherapist.com/sitemap.xml` — lists all therapist URLs
- [ ] **Robots:** Visit `https://www.indiatherapist.com/robots.txt` — confirms `/admin` is disallowed

---

## Environment Variables Reference

### API (`api/.env`)
| Variable | Description |
|---|---|
| `PORT` | API server port (default: 3001) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS) |
| `META_WA_PHONE_NUMBER_ID` | WhatsApp phone number ID from Meta |
| `META_WA_ACCESS_TOKEN` | Meta System User permanent access token |
| `META_WA_BUSINESS_ACCOUNT_ID` | WhatsApp Business Account ID |
| `META_WA_VERIFY_TOKEN` | Webhook verification token (you choose) |
| `VAPI_API_KEY` | Vapi.ai API key |
| `VAPI_AGENT_ID` | Vapi assistant ID |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `ADMIN_SECRET` | Admin dashboard password |

### Web (`web/.env.local`)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Full public URL of the web app |
| `NEXT_PUBLIC_API_URL` | URL of the API server |
| `NEXT_PUBLIC_ADMIN_SECRET` | Same value as API `ADMIN_SECRET` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (safe to expose) |
