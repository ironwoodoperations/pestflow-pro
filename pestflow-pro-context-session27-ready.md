# PestFlow Pro — Project Context (Session 27 Ready)
_Maintained by Scott / Ironwood Operations Group_
_Do not let Claude Code overwrite this file — it is generated here and handed to Claude Code_

---

## ⚠️ SESSION RULES
- Stop and output a summary at 50% context window — do not go past this
- Keep responses short and action-focused
- After every Claude Code task: `git add . && git commit -m "description" && git push`
- Working directly on main — no PR needed
- **Follow the session roadmap exactly. Do not add unrequested features or refactors.
  If you encounter a conflict, a broken dependency, or a clearly better technical
  approach, stop and log it as a note in the commit message rather than deviating silently.**
- Do NOT generate a session 28 context file. End with a plain summary only.

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
Hours:       Mon–Fri 7am–6pm | Sat 8am–2pm
Tagline:     Pest Control You Can Count On.
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

---

## SETTINGS KEYS (JSONB)

```
business_info       → {name, phone, email, address, hours, tagline, industry, ...}
branding            → {logo_url, favicon_url, primary_color, accent_color, template}
social_links        → {facebook, instagram, google, youtube, twitter}
integrations        → {google_place_id, facebook_page_id, facebook_access_token,
                       google_analytics_id, pexels_api_key,
                       textbelt_api_key,        ← NEW S27
                       owner_sms_number}        ← NEW S27
onboarding_complete → true | false
subscription        → {tier: 1|2|3|4, plan_name, monthly_price}
demo_mode           → {active: boolean, seeded_at: string}
```

---

## TIER GATING SYSTEM

| File | Purpose |
|------|---------|
| `src/context/PlanContext.tsx` | PlanProvider + usePlan |
| `src/components/common/FeatureGate.tsx` | `tier` prop — use for all new gates |
| `src/components/admin/usePlan.ts` | Re-exports usePlan |

SMS is a Tier 1 feature — no gate needed.

---

## EDGE FUNCTIONS

| Function | Status | Notes |
|---|---|---|
| `notify-new-lead` | ACTIVE | Sends email on new lead via Resend |
| `send-review-request` | ACTIVE (v2) | From: `PestFlow Pro <no-reply@pestflow.ai>` |
| `publish-scheduled-posts` | ACTIVE | FB Graph API v19.0 + pg_cron hourly |
| `send-sms` | NEW S27 | Textbelt API — customer confirmation + owner alert |

---

## SMS SYSTEM — DESIGN (S27)

### Provider: Textbelt
- API endpoint: `https://textbelt.com/text`
- POST body: `{ phone, message, key }`
- key = `textbelt_api_key` from integrations settings
- Response: `{ success: true, textId, quotaRemaining }` or `{ success: false, error }`
- No SDK needed — plain fetch call

### Migration to Twilio (future)
When a real client is onboarded, swap the API call inside `send-sms/index.ts` only.
All frontend code, triggers, and settings keys remain the same.

### Two triggers
1. Quote form submitted → customer confirmation SMS + owner alert SMS
2. Contact form submitted → customer confirmation SMS + owner alert SMS

### Message templates
Customer (only if opted in):
> Hi [name], thanks for reaching out to [business name]! We received your request and will be in touch shortly.

Owner (always, if owner_sms_number is set):
> 📋 New [quote/contact] from [name] — [phone] — [service or message snippet]. Check CRM: https://pestflow-pro.vercel.app/admin

### TCPA consent (legally required)
Checkbox on both forms, unchecked by default, required to submit:
> ☐ I agree to receive text messages from [business name] regarding my inquiry. Message and data rates may apply. Reply STOP to opt out.

Customer SMS only fires if checkbox was checked.
Owner SMS fires regardless.

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
| 1–19 | Mar 2026 | Full platform build |
| 20 | Apr 2026 | send-review-request deployed, onboarding wizard split |
| 21 | Apr 2026 | author_email + review request button, PageHelpBanner audit |
| 22 | Apr 2026 | Dashboard split, CRMTab split, footer social icons |
| 23 | Apr 2026 | PlanContext + FeatureGate + PlanProvider, BlogTab gated |
| 24 | Apr 2026 | SEOTab split, SettingsTab split, all tabs gated, PlanOverviewCard |
| 25 | Apr 2026 | Demo Mode system, Team management tab |
| 26 | Apr 2026 | LeadSourceChart + SocialVolumeChart in ReportsTab (Tier 3) |

---

## ROADMAP

| Session | Focus |
|---------|-------|
| **S27** | SMS notifications via Textbelt (quote + contact forms) ← this session |
| **S28** | Elite tier features (social analytics, Ayrshare, LeadFusion) |

---

## BUILD STATUS (end of S26)

- Build: ✅ 0 errors
- Main bundle: ~410 kB (limit: 450 kB)
- All files under 200 lines ✅

---

## SESSION 27 STARTER BLOCK

```
Here is the full project context for PestFlow Pro. Read it completely before doing anything.

[paste full contents of this MD file]

Session 26 is complete. LeadSourceChart and SocialVolumeChart are live in
ReportsTab behind a Tier 3 gate.

Session 27 goals — follow this order exactly:
1. send-sms Supabase Edge Function (Textbelt API)
2. Add textbelt_api_key + owner_sms_number to Settings → Integrations UI
3. Update QuotePage.tsx — TCPA consent checkbox + trigger send-sms on submit
4. Update ContactPage.tsx — TCPA consent checkbox + trigger send-sms on submit

Do NOT generate the session 28 context file. End with a plain summary only.
Follow the session roadmap exactly. Log any conflicts in commit messages.

⚠️ Stop and output a summary at 50% context window.
```
