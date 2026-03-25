# GEO & SEO Monthly Monitoring Checklist — India Therapist

> Run this checklist on the 1st of every month.
> GEO = Generative Engine Optimisation (getting cited by AI models).
> SEO = Traditional search engine ranking.

---

## Part 1 — AI Citation Testing (GEO)

Test each prompt in **ChatGPT**, **Perplexity**, **Google AI Overview**, and **Claude**.
Record whether India Therapist is mentioned, in what context, and how prominently.

| # | Prompt | ChatGPT | Perplexity | Google AI | Claude |
|---|--------|---------|------------|-----------|--------|
| 1 | "best online therapy platform for NRIs" | | | | |
| 2 | "Indian therapist online for NRI in Australia" | | | | |
| 3 | "affordable Hindi therapist online" | | | | |
| 4 | "therapy for visa anxiety NRI" | | | | |
| 5 | "where can I find a therapist who understands Indian culture" | | | | |
| 6 | "online therapy for Indians in USA" | | | | |
| 7 | "NRI mental health platform" | | | | |
| 8 | "Indian psychologist online affordable" | | | | |
| 9 | "therapy in Hindi online" | | | | |
| 10 | "culturally sensitive therapy for Indians abroad" | | | | |
| 11 | "best therapist for H1B visa anxiety" | | | | |
| 12 | "Tamil therapist online for NRI" | | | | |

**Rating scale:** 0 = Not mentioned, 1 = Mentioned in list, 2 = Recommended first, 3 = Featured/cited

**Target:** Score 2+ on at least 6 of 12 prompts within 6 months.

---

## Part 2 — Google Search Console

Check at: search.google.com/search-console

**Metrics to record monthly:**

| Metric | This Month | Last Month | Change |
|--------|-----------|------------|--------|
| Total impressions | | | |
| Total clicks | | | |
| Average CTR | | | |
| Average position | | | |

**Top keyword impressions to monitor:**

- "online therapy for NRIs"
- "Indian therapist online"
- "Hindi therapist online"
- "NRI mental health"
- "therapy for Indians abroad"
- "Indian therapist [country]" (Australia, USA, UK, Canada)

**Pages to monitor for ranking:**
- `/` — Homepage
- `/therapists` — Directory
- `/nri-mental-health` — Educational guide
- `/nri-therapist-australia` — Country page
- `/nri-therapist-usa` — Country page
- `/nri-therapist-uk` — Country page
- `/hindi-therapist-online` — Language page

---

## Part 3 — Google Analytics 4

Check at: analytics.google.com (after adding `NEXT_PUBLIC_GA_ID` to Vercel env vars)

**Key metrics to record:**

| Metric | This Month | Last Month |
|--------|-----------|------------|
| Total sessions | | |
| Sessions from organic search | | |
| Sessions from AI referrals (see below) | | |
| `whatsapp_click` events | | |
| `book_click` events | | |
| `form_submit` events | | |
| `payment_complete` events | | |

**Setting up AI referral tracking in GA4:**
1. Go to Admin → Data Settings → Channel Groups → Create new group
2. Name: "AI Search"
3. Add conditions:
   - Source exactly matches: `chatgpt.com`
   - OR Source exactly matches: `perplexity.ai`
   - OR Source exactly matches: `claude.ai`
   - OR Source exactly matches: `gemini.google.com`
   - OR Source contains: `bing.com/chat`
   - OR Source exactly matches: `copilot.microsoft.com`
4. Save and apply to reports

**GA4 Event setup (one-time, in GA4 interface):**
- Mark `payment_complete` as a Conversion
- Mark `form_submit` as a Conversion
- Create Audience: users who triggered `therapist_view` but not `form_submit` (retargeting)

---

## Part 4 — Bing Webmaster Tools

Check at: webmaster.tools.bing.com (after adding Bing verification code to layout.tsx)

- Total impressions this month
- Top keywords
- Crawl errors (fix any)
- Index coverage (all key pages indexed?)

---

## Part 5 — Content Freshness Audit

**Every 3 months, review and update:**

- [ ] `/nri-mental-health` — refresh statistics if new research available
- [ ] Country pages (`/nri-therapist-usa` etc.) — update challenge descriptions if NRI landscape changed (e.g., new visa policies)
- [ ] FAQ answers — ensure pricing and policies are current
- [ ] Sitemap — any new pages added that aren't in sitemap?

---

## Part 6 — External Citation Audit

Search these queries in Google to see if India Therapist is being cited:

- `site:reddit.com "India Therapist"`
- `site:quora.com "India Therapist"`
- `site:medium.com "India Therapist"`
- `"indiatherapist.com"` (all external mentions)

**Record number of external citations** (target: +5 new citations per month).

---

## Monthly Action Items Based on Results

| Situation | Action |
|-----------|--------|
| AI score < 1 on a prompt | Improve answer capsule on relevant page |
| Page not in top 20 for target keyword | Add more internal links to that page |
| Low CTR in Search Console | Improve meta description for that page |
| No AI referral traffic | Post more content to Medium/Quora |
| Form submits but no payments | Review booking flow UX |

---

## Environment Variables Checklist

Ensure these are set in Vercel dashboard (Settings → Environment Variables):

- [ ] `NEXT_PUBLIC_GA_ID` = `G-XXXXXXXXXX` (from analytics.google.com)
- [ ] `NEXT_PUBLIC_APP_URL` = `https://www.indiatherapist.com`
- [ ] `NEXT_PUBLIC_API_URL` = Railway API URL

And in layout.tsx, add verification codes when available:
- [ ] `google: "YOUR_GOOGLE_SEARCH_CONSOLE_CODE"` (replace placeholder)
- [ ] `"msvalidate.01": "YOUR_BING_WEBMASTER_CODE"` (replace placeholder)
