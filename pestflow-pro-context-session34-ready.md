# PestFlow Pro — Project Context (Session 34 Ready)
_Maintained by Scott / Ironwood Operations Group_
_Do not let Claude Code overwrite this file — it is generated here and handed to Claude Code_

---

## ⚠️ SESSION RULES
- Stop and output a summary at 50% context window — do not go past this
- After every Claude Code task: `git add . && git commit -m "description" && git push`
- Working directly on main — no PR needed
- **Follow the session roadmap exactly. Log conflicts in commit messages.**
- Do NOT generate a session 35 context file. End with a plain summary only.

---

## CRITICAL CONSTANTS

```
Live URL:       https://pestflow-pro.vercel.app
Admin URL:      https://pestflow-pro.vercel.app/admin/login
GitHub:         https://github.com/ironwoodoperations/pestflow-pro
Supabase URL:   https://biezzykcgzkrwdgqpsar.supabase.co
Supabase ID:    biezzykcgzkrwdgqpsar
Tenant ID:      9215b06b-3eb5-49a1-a16e-7ff214bf6783
Admin login:    admin@pestflowpro.com / pf123demo
Dev server:     npm run dev → localhost:8080
Model:          claude-sonnet-4-6 (ALWAYS)
```

---

## SETTINGS KEYS (JSONB)

```
business_info       → {name, phone, email, address, hours, tagline, industry,
                       license, certifications, founded_year, num_technicians}
branding            → {logo_url, primary_color, accent_color, template, cta_text}
customization       → {hero_headline, show_license, show_years,
                       show_technicians, show_certifications}
social_links        → {facebook, instagram, google, youtube}
integrations        → {google_place_id, facebook_page_id, facebook_access_token,
                       google_analytics_id, pexels_api_key,
                       textbelt_api_key, owner_sms_number, ayrshare_api_key}
onboarding_complete → true | false
legal_acceptance    → {accepted: bool, timestamp: string, ip: string,  ← NEW S34
                       plan: string, terms_version: string}
subscription        → {tier: 1|2|3|4, plan_name, monthly_price}
demo_mode           → {active: boolean, seeded_at: string}
```

---

## LEGAL DOCUMENTS (completed — not in platform yet)

Five updated documents exist. S34 wires legal acceptance into the platform:

| Document | Status |
|----------|--------|
| Customer License Agreement (updated) | ✅ Complete |
| Terms of Service / EULA | ✅ New |
| Privacy Policy | ✅ New |
| Sales Rep Agreement (updated) | ✅ Complete |
| NDA (updated) | ✅ Complete |

**Current pricing (use these everywhere):**
- Starter: $149/mo
- Grow: $249/mo
- Pro: $349/mo
- Elite: $499/mo
- Setup fee: $2,000 one-time

---

## ONBOARDING WIZARD — CURRENT STATE

Files in `src/components/admin/onboarding/`:
- `types.ts` — FormData interface + INITIAL_FORM
- `StepWelcome.tsx` — Step 1
- `StepBusinessInfo.tsx` — Step 2
- `StepSocialLinks.tsx` — Step 3
- `StepBranding.tsx` — Step 4
- `StepLocations.tsx` — Step 5
- `StepReview.tsx` — Step 6 (Launch step — ADD LEGAL CHECKBOXES HERE)

Orchestrator: `src/pages/admin/Onboarding.tsx` (~110 lines)

**StepReview.tsx is where legal acceptance goes.** It's the final step before the Launch button. Three checkboxes must be added before the button can be clicked.

---

## CLIENT SETUP WIZARD — CURRENT STATE

Files in `src/components/admin/client-setup/`:
- `types.ts` — ClientSetupForm + PLAN_LABELS
- `ClientSetupStep1.tsx` through `ClientSetupStep5.tsx`
- `ClientSetupWizard.tsx` — orchestrator, handleExport downloads + emails
- `ClientSetupPage.tsx` — admin page with PageHelpBanner

**S34 task: make handleExport also pre-populate the new tenant's settings rows via Supabase API.**

---

## TIER GATING

Single canonical component: `src/components/common/FeatureGate.tsx`
Props: `minTier` (required), `featureName?`, `fallback?`

---

## RULES (NEVER VIOLATE)

- Model is ALWAYS claude-sonnet-4-6
- Relative imports only — NO @/ aliases
- Single useState object for forms — never per-field state
- maybeSingle() not single() for settings queries
- All files <200 lines — split before editing
- Working directly on main — no PR needed
- Do NOT generate a context file — plain summary only at end
- Watch bundle size — hard limit 450 kB

---

## SESSION LOG

| Session | Date | Key Completions |
|---------|------|----------------|
| 1–32 | Mar–Apr 2026 | Full platform, shells, tier gating, SMS, legal docs |
| 33 | Apr 2026 | 4 genuinely different ShellHomeSections layouts |
| 34 | Apr 2026 | Legal checkboxes in onboarding, Client Setup pre-populates settings ← this session |

---

## SESSION 34 STARTER BLOCK

```
Here is the full project context for PestFlow Pro. Read it completely before doing anything.

[paste full contents of this MD file]

Session 33 is complete. All 4 shells now have genuinely different home page layouts.

Session 34 goals — follow this order exactly:
1. Legal acceptance checkboxes in StepReview.tsx (onboarding wizard)
2. Store acceptance in settings key legal_acceptance
3. Client Setup wizard pre-populates new tenant settings on export
4. Add Terms of Service and Privacy Policy static pages to the public site

Do NOT generate the session 35 context file. End with a plain summary only.
Follow the session roadmap exactly. Log any conflicts in commit messages.

⚠️ Stop and output a summary at 50% context window.
```
