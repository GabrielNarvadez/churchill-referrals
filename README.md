# Churchill Referrals

Vercel-hosted referral form for Churchill Education. Replaces the systeme.io + Google Form MVP with:
- Automatic alumni verification against HubSpot
- Tier-appropriate rewards ($100 for alumni / $50 for prospects)
- Direct contact association in HubSpot (no manual SMT lookup)

## Programs

| Route | Audience | Referrer reward | Referred reward |
|---|---|---|---|
| `/double` | Churchill alumni | $100 | $100 off first qualification |
| `/friends` | Prospects exploring Churchill | $50 | — |

## Architecture

```
POST /api/refer
  → zod-validate payload
  → look up referrer email in HubSpot
  → classify: alumni (alumni__c=Yes OR lifecyclestage=Alumni) / prospect / unknown
  → enforce: /double + non-alumni = 403 with redirect to /friends
  → upsert referred contact in HubSpot with:
      - referred_by___email / first_name / last_name
      - referred_by__c (full name, legacy)
      - were_you_referred_to_churchill_by_someone_ = Yes
      - is_the_referee_an_alumni_graduate__c = Yes/No (based on referrer)
      - referral_program_source = double_referral | friends_of_churchill
  → ensure referrer contact exists (create as lead if not in HubSpot)
  → return 200 → redirect to /thanks
```

## HubSpot setup

Required contact property (already created in Churchill portal 44447390 on 2026-06-03):

| Name | Type | Options |
|---|---|---|
| `referral_program_source` | enum (select) | `double_referral`, `friends_of_churchill` |

Existing properties used (no changes needed):
- `alumni__c` (Yes/No/true/false)
- `lifecyclestage` (Alumni = `217604175`)
- `referred_by___email`, `referred_by___first_name`, `referred_by___last_name`
- `referred_by__c`
- `were_you_referred_to_churchill_by_someone_`
- `is_the_referee_an_alumni_graduate__c`

### HubSpot workflows to wire up (Manny + Leonie)

Trigger on `referral_program_source` is known:

1. **Double Referral Program (Alumni)** — `referral_program_source = double_referral`
   - Send branded confirmation to referred contact (friend)
   - Send confirmation to referrer (looked up via `referred_by___email`)
   - Create internal task: "Apply $100 bursary + line item to deal once enrolment confirmed" (SMT)

2. **Friends of Churchill (Prospect)** — `referral_program_source = friends_of_churchill`
   - Send branded confirmation to referred contact (friend)
   - Send $50 confirmation to referrer
   - Task: "Verify friend enrols before referrer's own first qualification purchase" (SMT)

## Local development

```bash
cp .env.example .env.local
# Set HUBSPOT_CHURCHILL_PAT (find it in workspaces/.env)
npm install
npm run dev
# Open http://localhost:3000/double or /friends
```

## Deployment (Vercel)

1. Push repo to GitHub: `GabrielNarvadez/churchill-referrals`
2. Import into the Churchill Vercel account Manny is creating
3. Set env vars:
   - `HUBSPOT_CHURCHILL_PAT` (production)
4. Configure custom domain: `refer.churchilleducation.edu.au` (requires DNS access via Duncan)
5. Both `/double` and `/friends` are statically pre-rendered; `/api/refer` runs on Node serverless

## What's NOT in this repo (intentional)

- **Email sending**: handled by HubSpot Marketing workflows triggered on `referral_program_source` property change. Copy lives in HubSpot for Manny/Leonie to edit without code changes.
- **Reward payout tracking**: handled in HubSpot via the existing `referral_reward` property by the SMT once the friend enrols and pays.
- **Bursary + line item on deal**: stays manual per the [Double Alumni Referral Rewards Process](../../landing-pages/double-alumni-referral/Double-Alumni-Referral-Rewards-Process.pdf) — SMT applies on enrolment.

## Stack

- Next.js 15 (App Router) + React 19
- TypeScript strict mode
- Tailwind CSS (Churchill brand: navy `#1f3567`, red `#E4211B`, Lato font)
- Zod for input validation
- HubSpot CRM v3 REST API (no SDK — fetch wrapper in `lib/hubspot.ts`)
