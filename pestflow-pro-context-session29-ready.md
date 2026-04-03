# PestFlow Pro — Project Context (Session 29 Ready)
_Maintained by Scott / Ironwood Operations Group_
_Do not let Claude Code overwrite this file — it is generated here and handed to Claude Code_

---

## ⚠️ SESSION RULES
- Stop and output a summary at 50% context window — do not go past this
- Keep responses short and action-focused
- After every Claude Code task: `git add . && git commit -m "description" && git push`
- Working directly on main — no PR needed
- **Follow the session roadmap exactly. Do not add unrequested features or refactors.
  If you encounter a conflict or a clearly better approach, log it in the commit
  message rather than deviating silently.**
- Do NOT generate a session 30 context file. End with a plain summary only.

---

## CRITICAL CONSTANTS (never change)

```
Live URL:       https://pestflow-pro.vercel.app
Admin URL:      https://pestflow-pro.vercel.app/admin/login
GitHub:         https://github.com/ironwoodoperations/pestflow-pro
Supabase URL:   https://biezzykcgzkrwdgqpsar.supabase.co
Supabase ID:    biezzykcgzkrwdgqpsar
Tenant ID:      9215b06b-3eb5-49a1-a16e-7ff214bf6783
Admin login:    admin@pestflowpro.com / pf123demo
Dev server:     npm run dev → localhost:8080
Model:          claude-sonnet-4-6 (ALWAYS — no exceptions)
Stack:          React 18 + TypeScript + Vite + Tailwind + Supabase + Vercel
```

---

## DEMO COMPANY

```
Name:        Ironclad Pest Solutions
Phone:       (903) 555-0142
Email:       info@ironclad-pest.com
Address:     1204 S. Main Street, Tyler, TX 75701
Industry:    Pest Control
Tenant ID:   9215b06b-3eb5-49a1-a16e-7ff214bf6783
```

---

## ENV VARS

```
VITE_SUPABASE_URL=https://biezzykcgzkrwdgqpsar.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpZXp6eWtjZ3prcndkZ3Fwc2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTQ4MjMsImV4cCI6MjA5MDM3MDgyM30.NLuAr1IhZIVixqOnB0BzeTHOlHrjhD5eDDYNGzZ4_dc
VITE_ANTHROPIC_API_KEY=[set in Vercel]
VITE_TENANT_ID=9215b06b-3eb5-49a1-a16e-7ff214bf6783
```

⚠️ NO `@/` path aliases — relative imports only throughout this repo
⚠️ Use maybeSingle() not single() for settings queries

---

## TIER GATING SYSTEM (consolidated S28)

Single canonical component: `src/components/common/FeatureGate.tsx`
Props: `minTier` (required), `featureName?` (optional), `fallback?` (optional)
Import pattern: `import { FeatureGate } from '../../components/common/FeatureGate'`

| Tier | Plan | Price |
|------|------|-------|
| 1 | Starter | $149 |
| 2 | Grow | $249 |
| 3 | Pro | $349 |
| 4 | Elite | $499 |

---

## SOCIAL CONNECTIONS MODAL TAB NAMES (update in S29)

Current → New:
- Export Mode → **Hands-On**
- DIY → **DIY**
- A Little Help → **Semi-Auto**
- I Need a Pro → **Full Autopilot**

File: `src/components/admin/social/ConnectionsModal.tsx`

---

## EDGE FUNCTIONS

| Function | Status | Notes |
|---|---|---|
| `notify-new-lead` | ACTIVE | Resend email on new lead |
| `send-review-request` | ACTIVE (v2) | From: `PestFlow Pro <no-reply@pestflow.ai>` |
| `publish-scheduled-posts` | ACTIVE | FB Graph API v19.0 + pg_cron |
| `send-sms` | ACTIVE | Textbelt — requires TEXTBELT_API_KEY secret |
| `send-onboarding-email` | NEW S29 | Emails client setup doc to scott@ironwoodoperationsgroup.com |

**Verified Resend domain:** pestflow.ai ✅
**RESEND_API_KEY:** Already set in Supabase Edge Function Secrets ✅
**Use for all outbound email:** `no-reply@pestflow.ai` or `onboarding@pestflow.ai`

---

## CLIENT SETUP WIZARD — DESIGN (S29)

This is a tool Scott uses DURING client onboarding calls — not a
client-facing page. It lives in the admin sidebar under "Client Setup."
It collects all the information needed to configure a new PestFlow Pro
tenant, then exports a formatted markdown document AND emails it to
scott@ironwoodoperationsgroup.com automatically.

### Steps (6 total)
1. **Plan** — Select tier (Starter/Grow/Pro/Elite) with price + feature summary
2. **Business Info** — Business name, contact name, phone, email, address, industry
3. **Branding** — Logo URL, primary color, tagline, website domain
4. **Social & Services** — Facebook, Instagram, Google, YouTube URLs + services offered (textarea)
5. **Integrations** — Google Place ID, GA4 ID, any notes
6. **Review & Export** — Summary of all collected info + Export button

### Export behavior
- Downloads a `.md` file named `{business_name}-pestflow-setup.md`
- Simultaneously POSTs to `send-onboarding-email` edge function
- Edge function emails the markdown content to scott@ironwoodoperationsgroup.com
- Toast on success: "✅ Setup file downloaded and emailed to Ironwood"

### Plan names + prices
```
Starter  — $149/mo — Website + CRM + basic SEO
Grow     — $249/mo — Full SEO + Blog + Social scheduling
Pro      — $349/mo — AI tools + campaigns + advanced reports
Elite    — $499/mo — All platforms + live reviews + priority support
```

---

## RULES (NEVER VIOLATE)

- Model is ALWAYS claude-sonnet-4-6
- Single useState object for forms — never per-field state
- NO `@/` path aliases — relative imports only
- Use maybeSingle() not single() for settings queries
- All files <200 lines — split before editing any file at limit
- Admin tabs lazy-loaded with React.lazy()
- PageHelpBanner on every admin tab
- Working directly on main — no PR needed
- Follow the session roadmap exactly
- Do NOT generate a context file — plain summary only at end

---

## PERMANENTLY OUT OF SCOPE

- Invoice generator
- Customer portal
- Technician calendar
- PDF reports / PDF export
- Self-serve pricing/signup page

---

## SESSION LOG

| Session | Date | Key Completions |
|---------|------|----------------|
| 1–24 | Mar–Apr 2026 | Full platform build, tier gating, file splits |
| 25 | Apr 2026 | Demo Mode system, Team management tab |
| 26 | Apr 2026 | LeadSourceChart + SocialVolumeChart (Tier 3) |
| 27 | Apr 2026 | SMS via Textbelt, TCPA consent on forms, send-sms edge function |
| 28 | Apr 2026 | FeatureGate consolidated, Social Analytics tab (Tier 4), Ayrshare stub |

---

## ROADMAP

| Session | Focus |
|---------|-------|
| **S29** | Tab renames in Social Connections modal + Client Setup wizard ← this session |
| **S30** | LeadFusion live Google reviews (Elite) — when account is ready |

---

## BUILD STATUS (end of S28)

- Build: ✅ 0 errors
- Main bundle: 408.41 kB (limit: 450 kB)
- All files under 200 lines ✅
- FeatureGate: single consolidated component ✅

---

## SESSION 29 STARTER BLOCK

```
Here is the full project context for PestFlow Pro. Read it completely before doing anything.

[paste full contents of this MD file]

Session 28 is complete. FeatureGate consolidated to single component.
Social Analytics tab live (Tier 4). Ayrshare stub in Integrations + Connections modal.
Build: 408.41 kB, 0 errors.

Session 29 goals — follow this order exactly:
1. Rename tabs in Social Connections modal
2. Build Client Setup wizard (admin tool for Scott's onboarding calls)
3. send-onboarding-email edge function

Do NOT generate the session 30 context file. End with a plain summary only.
Follow the session roadmap exactly. Log any conflicts in commit messages.

⚠️ Stop and output a summary at 50% context window.
```
