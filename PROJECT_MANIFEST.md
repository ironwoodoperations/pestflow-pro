# PROJECT_MANIFEST — PestFlow Pro
Last Updated: 2026-04-11 by Claude Code (S117)

---

## Status

| Field | Value |
|-------|-------|
| Current Phase | **Operate** — active feature additions on live multi-tenant platform |
| Sprint Goal | S117 complete. Awaiting next priority from Scott. |
| Sprint Status | On Track |
| Blocking Risks | Stripe live mode not yet cut over — no real billing active |
| Next Decision Needed | Which open item to tackle next — Scott decides |
| Recommended Next Owner | Claude Code (once Scott confirms priority) |

---

## What the App Is

PestFlow Pro is a white-label SaaS platform for pest control companies.
Scott (Ironwood Operations Group) sells it 1-on-1. Clients never self-serve.

**Two surfaces:**
- `/ironwood` — Scott's CRM (pipeline, prospects, reports, integrations, team, support inbox)
- `/admin` — Client dashboard (content, SEO, blog, social, testimonials, locations, reports, CRM, team, billing, support tickets, settings)

**Public site per tenant:** 12 pest pages, location pages, blog, quote wizard, reviews, FAQ, contact — served at `[slug].pestflowpro.com` or verified custom domain.

---

## Active Tenants

| Name | Slug | Template | Status |
|------|------|----------|--------|
| PestFlow Pro (demo) | pestflow-pro | modern-pro | Live — Demo |
| Cypress Creek Pest Control | cypress-creek-pest-control | modern-pro | Live — Active |
| Dang Pest Control | dang | dang (custom) | Live — Active |

---

## Critical Constants

```
Live URL:         https://pestflowpro.com
Ironwood Ops:     https://pestflowpro.com/ironwood
Demo Admin:       admin@pestflowpro.com / pf123demo
Demo Tenant ID:   9215b06b-3eb5-49a1-a16e-7ff214bf6783
Supabase ID:      biezzykcgzkrwdgqpsar
GitHub:           https://github.com/ironwoodoperations/pestflow-pro
Dev server:       doppler run -- npm run dev → localhost:8080
Model:            claude-sonnet-4-6 (ALWAYS — never any other string)
Bundle size:      ~354 kB (limit: 450 kB ✅)
```

---

## Completed This Session (S117)

| Task | Commit | Session | Description |
|------|--------|---------|-------------|
| task[1] | 8291b7d | S112b | Dang page content restore + tenant overwrite safeguard |
| task[4-prev] | bce7310 | S115 | Wire mailboxes into platform — Resend reply-to headers per mailbox type |
| task[3] | 3bb10b0 | S115 | Dang hero outline confirmed; support ticket files committed |
| task[4] | 3bb10b0 | S115 | Support ticket system — SupportTab (/admin), SupportPanel (/ironwood), notify-support-ticket edge fn, DB migration |
| task[5] | e9fbbef | S115 | Add New Page — ContentTab modal, CustomPage renderer, SlugRouter custom page routing |
| task[1] | (S116) | S116 | send-intake-confirmation edge fn — branded HTML, Resend, reply-to onboarding@ |
| task[2] | (S116) | S116 | send-welcome-email edge fn — payment confirmed email |
| task[3] | (S116) | S116 | send-reveal-ready edge fn — reveal call invite with M365 Bookings link |
| task[4] | (S116) | S116 | send-credentials-email edge fn — rewritten, credentials box, no-verify-jwt |
| task[5] | (S116) | S116 | send-dunning-email edge fn — 3 escalating variants, billing reply-to |
| task[6] | (S116) | S116 | Send Reveal Ready Email button wired into ProspectDetail.Provisioning |
| task[7] | (S116) | S116 | Updated send credentials call — new field shape, no JWT requirement |
| task[1] | (S117) | S117 | Read social_posts schema — confirmed caption/platform/archived_at columns |
| task[2] | (S117) | S117 | pg_cron confirmed active (v1.6.4) + pg_net (v0.20.0) — cron job scheduled at */5 * * * * |
| task[3] | ed9ac82 | S117 | publish-scheduled-posts updated — bundle.social primary, Ayrshare legacy, FB Graph fallback, archived_at filter |
| task[4] | (verify) | S117 | Cron test confirmed — post published at 03:35:03 UTC by pg_cron run #2 |
| task[5] | bc45773 | S117 | ZAPIER_WEBHOOK_SETUP.md — 6 webhooks, filter notes, cron reference, edge fn table |

---

## Open Items

| # | Item | Severity | Owner | Notes |
|---|------|----------|-------|-------|
| 1 | **Stripe live mode cutover** | 🔴 BLOCKING | Scott (manual) | Swap keys in Doppler + Vercel, register webhook. No real billing until done. |
| 2 | **Kirk DNS → Dang custom domain** | 🟡 High | Kirk + Scott | `verified = false` in tenant_domains. Flip to true once Kirk confirms DNS points to Vercel. |
| 1 | **Stripe live mode cutover** | 🔴 BLOCKING | Scott (manual) | Swap keys in Doppler + Vercel, register webhook. No real billing until done. |
| 2 | **Kirk DNS → Dang custom domain** | 🟡 High | Kirk + Scott | `verified = false` in tenant_domains. Flip to true once Kirk confirms DNS points to Vercel. |
| 3 | **Scheduled post execution** | 🟢 Done | Claude Code | pg_cron fires `publish-scheduled-posts` every 5 min. bundle.social → Ayrshare → FB Graph priority. Confirmed live 2026-04-11. ✅ |
| 4 | **Cypress Creek bundle.social setup** | 🟡 High | Scott (manual) | Create team in bundle.social → store team ID in settings.integrations.bundle_social_team_id. |
| 5 | **PROJECT_MANIFEST.md** | 🟢 Done | Claude Code | Created S115 ✅ |
| 6 | **Scheduled post cron job** | 🟢 Done | Claude Code | Done — see #3 ✅ |
| 7 | **Resend email templates** | 🟢 Done | Claude Code | All 5 templates built and deployed (S116): intake-confirmation, welcome, reveal-ready, credentials, dunning ✅ |
| 8 | **Supabase webhooks** | 🟠 Medium | Scott (manual) | Instructions in ZAPIER_WEBHOOK_SETUP.md. Scott creates 6 webhooks in Supabase Dashboard manually. |
| 9 | **Zapier Session A** | 🟠 Medium | Scott | ZAP 1–5 onboarding pipeline — requires Supabase webhooks (#8) first. Webhook config in ZAPIER_WEBHOOK_SETUP.md. |
| 10 | **Zapier Session B** | 🟠 Medium | Scott | ZAP 6–7 ongoing ops (new lead, blog published) — after Session A. |
| 11 | **Add New Page — public routing for Dang** | 🟢 Low | Claude Code | CustomPage uses PublicShell. Dang shell uses DangPageRouter. Custom pages on Dang tenant won't use Dang styling. Acceptable for now. |
| 12 | **Static site export** | 🟢 Low | Claude Code | HTML snapshot for backup/offboarding. Paid handoff feature ($500–$1,000). |
| 13 | **Firecrawl upgrade** | 🟢 Low | Scott (manual) | Upgrade to Hobby plan ($16/mo) at firecrawl.dev for YouPest scraping. Free tier works for demo. |

---

## Decisions Log

| Date | Decision | Made By | Rationale |
|------|----------|---------|-----------|
| 2026-04-11 | PROJECT_MANIFEST.md replaces pestflow-pro-context-session13-ready.md as session context anchor | Scott | Process standard alignment with IRONWOOD_OPS_PROCESS_STARTER_v2 |
| 2026-04-11 | Support tickets use profiles.tenant_id for RLS (not user_roles — that table has no tenant_id) | Claude Code | Discovered user_roles has no tenant_id column during migration |
| 2026-04-11 | publish-scheduled-posts is the cron entry point (not post-to-social) — post-to-social blocked by JWT + bundle_social_account_id check | Claude Code | post-to-social checks account_id (not used by bundle.social API), would 400 all cron calls |
| 2026-04-11 | blog_posts has no status column — webhook filter must use published_at IS NOT NULL | Claude Code | Corrected in ZAPIER_WEBHOOK_SETUP.md |
| 2026-04-11 | Supabase webhooks fire on every UPDATE — Zapier filter step needed to detect null→non-null transition via old_record | Claude Code | Documented in ZAPIER_WEBHOOK_SETUP.md important filter note |
| 2026-04-10 | Mailboxes: Resend sends from noreply@pestflow.ai; reply-to varies by type | Scott | M365 shared mailboxes confirmed live |
| 2026-04-10 | Dang custom domain verified=false until Kirk confirms DNS | Scott | Do not flip until confirmed |
| 2026-03-xx | Archive before delete — soft-archive pattern for tenants/prospects/leads/social/blog | Scott | Safety — no hard deletes without archive step |
| 2026-03-xx | bundle.social replaces Buffer for social posting | Scott | Bundle.social Pro plan unlimited accounts |
| 2026-03-xx | Resend sending domain: pestflow.ai (verified) | Scott | pestflowpro.com not added to Resend — not needed |

---

## Key File Paths (S115 state)

```
src/pages/admin/Dashboard.tsx          ← Client admin shell — all tabs
src/pages/IronwoodOps.tsx              ← Ironwood CRM shell — all tabs
src/components/admin/SupportTab.tsx    ← Support tickets (client side) [NEW S115]
src/components/ironwood/SupportPanel.tsx ← Support inbox (Scott side) [NEW S115]
src/pages/CustomPage.tsx               ← Public custom page renderer [NEW S115]
src/pages/SlugRouter.tsx               ← Routes /:slug → location | custom-page | 404
src/components/admin/ContentTab.tsx    ← Content editor + New Page modal [UPDATED S115]
src/shells/dang/                       ← Full custom Dang shell
src/lib/shellThemes.ts                 ← CSS custom property shell definitions
supabase/functions/notify-support-ticket/ ← Resend email on ticket create [NEW S115]
supabase/functions/notify-new-lead/    ← Resend email on lead submit
supabase/functions/post-to-social/     ← bundle.social posting (frontend-triggered)
supabase/functions/publish-scheduled-posts/ ← Cron entry point — bundle.social→Ayrshare→FB Graph [UPDATED S117]
supabase/functions/send-intake-confirmation/ ← Intake form submitted email [NEW S116]
supabase/functions/send-welcome-email/ ← Payment confirmed email [NEW S116]
supabase/functions/send-reveal-ready/  ← Reveal call invite email [NEW S116]
supabase/functions/send-credentials-email/ ← Admin login credentials email [UPDATED S116]
supabase/functions/send-dunning-email/ ← 3-variant dunning email [NEW S116]
supabase/functions/provision-tenant/   ← Full tenant provisioning
supabase/functions/ironwood-provision/ ← JWT wrapper for provision-tenant
ZAPIER_WEBHOOK_SETUP.md               ← 6 webhook configs for Scott (Supabase + Zapier) [NEW S117]
```

---

## Session Boot Command (use this every session)

```bash
doppler run -- claude --dangerously-skip-permissions \
  "Read CLAUDE.md and SKILL.md first. \
   Then read PROJECT_MANIFEST.md. \
   Then run: git status && git log --oneline -10. \
   When done reading, state: \
   1. Current phase and sprint goal \
   2. What the app currently does (one paragraph) \
   3. What is broken or incomplete right now \
   4. Your proposed next action \
   5. Any files you need to read before starting \
   Do not touch any file until I confirm your plan."
```

---

## Session Log

| Session | Date | Key Completions |
|---------|------|-----------------|
| S1–S107 | Mar 2026 | Full platform build, all 4 shells, Dang shell, multi-tenancy |
| S108 | Mar 2026 | MarketingLanding, bundle.social, 447 kB |
| S109 | Mar 2026 | Marketing fonts, bundle.social gating |
| S110 | Mar 2026 | SMS hotfixes, Textbelt fallback |
| S112 | Mar 2026 | Bundle 447→353 kB, bundle.social stack rewired, clean-friendly |
| S112b | Apr 2026 | Dang content restore, tenant overwrite safeguard |
| S113 | Apr 2026 | Custom domain routing, canonical tags, redirect, archive DB migration |
| S115 | Apr 2026 | Mailbox wiring, support ticket system, Add New Page, PROJECT_MANIFEST created |
| S116 | Apr 2026 | 5 HTML email templates (intake, welcome, reveal, credentials, dunning), Reveal Ready button in Ironwood Provisioning |
| S117 | Apr 2026 | pg_cron + publish-scheduled-posts → bundle.social cron live, ZAPIER_WEBHOOK_SETUP.md created |
