# PestFlow Pro — Project Context (S119 Ready)
_Maintained by Scott / Ironwood Operations Group_
_Do not let Claude Code overwrite this file — generated in Claude.ai, handed to Claude Code_

---

## ⚠️ SESSION RULES — READ FIRST, EVERY SESSION
- **50% context window rule:** Stop and output plain summary at 50% context. No exceptions.
- After every task: `git add . && git commit -m "task[N]: description" && git push`
- Working directly on main — no branches, no PRs, ever
- Do NOT generate a context file — plain summary only at end
- Dev server: doppler run -- npm run dev — never npm run dev directly

---

## THEMING RULE — MANDATORY

Tailwind ONLY for: spacing, layout, flex/grid, border-radius, sizing, shadows, transitions.
ALL colors in public-facing components MUST use CSS custom properties via inline style.
No hardcoded hex for brand colors in any public shell component.

Exceptions (do not change):
  - src/components/admin/, src/components/ironwood/
  - IronwoodOps.tsx, IronwoodLogin.tsx, Login.tsx
  - Index.tsx bg-black/30, clean-friendly/ShellHero.tsx color-mix, SlugRouter.tsx bg-[#0a0f1e]
  - src/shells/dang/ — Dang uses its own hardcoded brand colors, do not change

---

## CRITICAL CONSTANTS

```
Live URL:         https://pestflowpro.com
Client Admin:     https://[slug].pestflowpro.com/admin
Ironwood Ops:     https://pestflowpro.com/ironwood
Sales Deck:       https://pestflowpro.com/sales-deck.html
GitHub:           https://github.com/ironwoodoperations/pestflow-pro
Supabase ID:      biezzykcgzkrwdgqpsar
Demo Tenant ID:   9215b06b-3eb5-49a1-a16e-7ff214bf6783
Demo Slug:        pestflow-pro
Demo Admin:       admin@pestflowpro.com / pf123demo
Model:            claude-sonnet-4-6 (ALWAYS)
Bundle:           ~354 kB (well under 450 kB limit ✅)
M365 Bookings:    https://outlook.office.com/book/PestFlowProOnboarding@ironwoodoperationsgroup.com/?ismsaljsauthenabled
Teams New Call:   https://teams.microsoft.com/l/meeting/new
```

---

## KEY LEARNINGS & PRINCIPLES

- **Auth: ALWAYS `refreshSession()`, NEVER `getSession()`**
- **Supabase secrets ≠ Doppler** — edge functions ONLY read from Supabase secrets
  Set via: `supabase secrets set KEY=value --project-ref biezzykcgzkrwdgqpsar`
- **Verify JWT trap:** New edge functions default JWT=ON. Toggle OFF for:
  scrape-prospect, ironwood-provision, generate-youpest, package-bolt-context, post-to-social, notify-support-ticket, send-intake-confirmation, send-welcome-email, send-reveal-ready, send-credentials-email, send-dunning-email
- **Template canonical names:** modern-pro | clean-friendly | bold-local | rustic-rugged | youpest | dang
- **Files under 200 lines.**
- **RLS first:** Check pg_policies before assuming code bugs.
- **RLS on support_tickets:** Uses profiles.tenant_id (not user_roles)
- **bundle.social API:** endpoint is https://api.bundle.social/api/v1/post, auth is x-api-key header,
  platform keys are UPPERCASE, FACEBOOK requires type: 'POST', teamId not accountId
- **Archive before delete:** archived_at columns on all major tables ✅
- **Prospect webhook fires on every keystroke** — auto-save means webhook fires before record is complete. Normal for dev testing. Real clients come in via intake form with complete data.

---

## PRICING / TIER STRUCTURE

  Starter  $149/mo — $0–$1,000 setup
  Growth   $249/mo — $1,000–$1,500 setup
  Pro      $349/mo — $2,000–$3,500 setup
  Elite    $499/mo — $4,000–$10,000 setup

---

## SHELLS

Canonical: modern-pro | clean-friendly | bold-local | rustic-rugged | youpest | dang
youpest = Pro/Elite only. dang = Dang only, NOT in template picker.

---

## ACTIVE TENANTS

| Name | Slug | Template | Status |
|------|------|----------|--------|
| PestFlow Pro | pestflow-pro | modern-pro | Demo |
| Cypress Creek Pest Control | cypress-creek-pest-control | modern-pro | ✅ Ready |
| Dang Pest Control | dang | dang | ✅ Complete |

---

## DANG PEST CONTROL TENANT

| Item | Value |
|------|-------|
| Tenant ID | 1611b16f-381b-4d4f-ba3a-fbde56ad425b |
| Slug | dang |
| Live at | dang.pestflowpro.com |
| Admin login | admin@dangpestcontrol.com / dang123 |
| Primary color | #F97316 |
| Accent color | #06B6D4 |
| Phone | (903) 871-0550 |
| bundle.social team ID | ea947412-9c59-4da8-9ddc-680ee0479c3d |
| Custom domain | dangpestcontrol.com (verified = false — waiting on Kirk DNS) |

### Dang Outstanding Items
- ⚠️ Kirk: clear "TEST TEST" from wasp-hornet-control intro in Content tab
- ⚠️ Kirk: DNS for dangpestcontrol.com → flip verified = true once confirmed

---

## SOCIAL POSTING — BUNDLE.SOCIAL

Provider: bundle.social (Pro plan) ✅
API key: BUNDLE_SOCIAL_API in Supabase secrets ✅
Edge function: post-to-social (JWT: false) ✅
pg_cron: publish-scheduled-posts runs every 5 min ✅ confirmed working

### Per-tenant team IDs:
| Tenant | Team ID |
|--------|---------|
| PestFlow Pro (demo) | bdbe4976-6563-431d-affd-232eba8b143a |
| Dang Pest Control | ea947412-9c59-4da8-9ddc-680ee0479c3d |
| Cypress Creek | NOT YET — create team in bundle.social first |

---

## EMAIL / MAILBOX ARCHITECTURE ✅

### Resend
- Sending domain: pestflow.ai ✅ VERIFIED
- From: noreply@pestflow.ai
- texasprotrailerrentals.com also verified in Resend (separate project)

### M365 Shared Mailboxes
| Address | Purpose |
|---------|---------|
| hello@pestflowpro.com | Marketing site contact CTA |
| onboarding@pestflowpro.com | Intake/welcome reply-to |
| pfsales@pestflowpro.com | Sales deck CTA |
| itsupport@pestflowpro.com | Support ticket destination |
| noreply@pestflow.ai | Resend from address |

### Resend Edge Functions (all deployed, JWT off) ✅
| Function | Trigger | Reply-to |
|----------|---------|----------|
| send-intake-confirmation | After intake submitted | onboarding@pestflowpro.com |
| send-welcome-email | After payment confirmed | onboarding@pestflowpro.com |
| send-reveal-ready | Manual from Ironwood | onboarding@pestflowpro.com |
| send-credentials-email | Manual from Ironwood | itsupport@pestflowpro.com |
| send-dunning-email | Stripe payment failed | billing@ironwoodoperationsgroup.com |

---

## FEATURES COMPLETE (S115–S119)

- ✅ Archive protection — all tables, two-step delete, UndoToast, tenant suspension
- ✅ Support ticket system — client /admin tab + Ironwood panel + email notify
- ✅ Add New Page — client content tab, SlugRouter, CustomPage component
- ✅ Mailboxes wired into platform
- ✅ Dang content restore + hero outline fix
- ✅ 5 Resend email templates built and deployed
- ✅ Reveal Ready + Credentials buttons in Ironwood prospect record
- ✅ pg_cron scheduled post execution (every 5 min, confirmed working)
- ✅ ZAPIER_WEBHOOK_SETUP.md in repo root
- ✅ Dang FAQ: 55 questions, 8 categories, search, accordion, AI assistant (S118 prompt ready to run)
- ✅ ZAPs 2, 3, 5 published and confirmed working (S119)

---

## ZAPIER STATUS

Zapier account: Scott Devore — Starter plan ✅
Supabase Database Webhooks: ENABLED ✅

### ZAP 1 — New Prospect Created ✅ PUBLISHED
- Trigger: Supabase prospects INSERT → zap1-new-prospect webhook
- Action 1: Microsoft Outlook → Create Contact (Company Name, Email, Phone)
- Action 2: Microsoft To Do → Create Task ("Call [company name]", note has contact + email)
- Status: LIVE

### ZAP 2 — Intake Form Submitted ✅ PUBLISHED
- Trigger: Supabase prospects UPDATE (intake_submitted_at IS NOT NULL)
- Supabase webhook needed: zap2-intake-submitted (prospects, UPDATE)
- Action 1: Webhooks POST → send-intake-confirmation edge function
- Action 2: Microsoft Teams → Send Channel Message

### ZAP 3 — Setup Invoice Sent ✅ PUBLISHED
- Trigger: Supabase prospects UPDATE (setup_invoice_sent_at IS NOT NULL)
- Supabase webhook needed: zap3-invoice-sent (prospects, UPDATE)
- Action: Microsoft To Do → Create Task with 48hr Delay

### ZAP 4 — Payment Confirmed
- Trigger: Stripe → New Payment
- Action 1: Webhooks POST → send-welcome-email edge function
- Action 2: Supabase UPDATE prospect status → 'onboarding'
- ⏸️ Blocked — Stripe test mode, resume at live mode cutover

### ZAP 5 — Tenant Provisioned ✅ PUBLISHED
- Trigger: Supabase tenants INSERT
- Supabase webhook needed: zap5-tenant-provisioned (tenants, INSERT)
- Action: Email Scott summary (site URL, admin URL)

### ZAPs 6–9 (Session B — build after A confirmed working)
- ZAP 6: New lead → SMS + email notify
- ZAP 7: Blog published → bundle.social post
- ZAP 8: Stripe renewal success → receipt email
- ZAP 9: Stripe payment failed → dunning email

---

## SUPABASE WEBHOOKS CREATED
| Name | Table | Event | Status |
|------|-------|-------|--------|
| zap1-new-prospect | prospects | INSERT | ✅ Live |
| zap2-intake-submitted | prospects | UPDATE | ✅ Live |
| zap3-invoice-sent | prospects | UPDATE | ✅ Live |
| zap5-tenant-provisioned | tenants | INSERT | ✅ Live |

---

## PRE-LAUNCH CHECKLIST

- [ ] **Stripe live mode** — swap keys in Doppler + Vercel, register webhook ⚠️ BLOCKING
- [ ] Firecrawl upgrade to Hobby ($16/mo)
- [ ] Cypress Creek — bundle.social team setup + Facebook connect
- [ ] Kirk DNS → flip verified = true for dangpestcontrol.com
- [ ] Run S118 prompt (Dang FAQ overhaul)
- [ ] ZAP 4 (Payment Confirmed) — resume at Stripe live mode cutover
- [x] bundle.social Pro plan ✅
- [x] All Resend edge functions deployed ✅
- [x] pestflow.ai verified in Resend ✅
- [x] M365 shared mailboxes created ✅
- [x] pg_cron scheduled posts working ✅
- [x] Zapier Starter plan ✅
- [x] ZAP 1 published ✅
- [x] ZAP 2 published ✅
- [x] ZAP 3 published ✅
- [x] ZAP 5 published ✅

---

## BACKLOG (priority order)

1. Zapier ZAPs 2–5 (Session A — in progress)
2. Run S118 Claude Code prompt (Dang FAQ)
3. Stripe live mode cutover (manual — Scott)
4. Cypress Creek bundle.social setup
5. Zapier ZAPs 6–9 (Session B)
6. Static site export

---

## SESSION LOG

| Session | Key Completions |
|---------|-----------------|
| S1–S107 | Full platform build |
| S108–S112 | Marketing, bundle.social, SMS, bundle size |
| S113 | Custom domain routing, archive_at migration |
| S115 | Archive protection, support tickets, add new page, mailboxes |
| S116 | 5 Resend email templates, reveal/credentials buttons in Ironwood |
| S117 | pg_cron scheduled posts, ZAPIER_WEBHOOK_SETUP.md |
| S118 | Dang FAQ prompt built (55 Qs, 8 categories, search, AI assistant) |
| S119 | ZAPs 2, 3, 5 published. ZAP 4 blocked on Stripe live mode. Tenants table columns confirmed. |
| Live | ZAP 1 published, Supabase webhooks enabled, Zapier Starter active |
