# PROJECT_MANIFEST — PestFlow Pro

**Framework Version: Ironwood v3.1** — installed 2026-05-16
**Workflow:** branch + PR + manual merge (see GIT_RULES.md)
**Last Updated:** 2026-05-16 by framework upgrade session

> ⚠️ This file is preserved from the S117 (April 2026) snapshot with the v3.1
> upgrade banner appended above. Session log entries S118–S222 are not
> reflected here yet; the working state of record between this manifest
> being updated is the SuperClawed session handoff thread.

---

## Status

| Field | Value |
|-------|-------|
| Current Phase | **Operate** — active feature additions on live multi-tenant platform |
| Sprint Goal | Framework v3.1 upgrade (this session). Next sprint: Reports tab GA4/GSC/PageSpeed wiring (per S222 plan). |
| Sprint Status | On Track |
| Blocking Risks | Stripe live mode not yet cut over — no real billing active |
| Next Decision Needed | Reports tab build — GCP project org parent (Cloud Identity vs user-owned), in flight at start of S222 |
| Recommended Next Owner | Claude Code Web (per kickoff from Scott) |

---

## What the App Is

PestFlow Pro is a white-label SaaS platform for pest control companies.
Scott (Ironwood Operations Group) sells it 1-on-1. Clients never self-serve.

**Two surfaces:**
- `/ironwood` — Scott's CRM (pipeline, prospects, reports, integrations, team, support inbox)
- `/admin` — Client dashboard (content, SEO, blog, social, testimonials, locations, reports, CRM, team, billing, support tickets, settings)

---

## Active Tenants

| Name | Slug | Template | Status |
|------|------|----------|--------|
| PestFlow Pro (demo) | pestflow-pro | modern-pro | Live — Demo |
| Cypress Creek Pest Control | cypress-creek-pest-control | modern-pro | Live — Active |
| Dang Pest Control | dang | dang (custom) | Live — Active (paying customer) |

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
```

---

## Open Items

| # | Item | Severity | Owner | Notes |
|---|------|----------|-------|-------|
| 1 | **Stripe live mode cutover** | 🔴 BLOCKING | Scott (manual) | Swap keys in Doppler + Vercel, register webhook. |
| 2 | **Kirk DNS → Dang custom domain** | 🟡 High | Kirk + Scott | `verified = false` in tenant_domains. |
| 3 | **Reports tab build — Google APIs wiring** | 🟡 High | CC Web | GA4, GSC, PageSpeed via service account. 10-step plan, ~40-50h CC Web work. |
| 4 | **GCP migration to Ironwood Workspace** | 🟡 High | Scott | In-flight at start of S222. |
| 5 | **Framework v3.1 upgrade** | 🟢 In Progress | This session | Branch+PR+hooks workflow upgrade into pestflow-pro |

---

## Decisions Log

| Date | Decision | Made By | Rationale |
|------|----------|---------|-----------|
| 2026-05-16 | Upgrade pestflow-pro to Ironwood Framework v3.1 with manual-merge default | Scott | Paying customer in production — keep manual review gate |
| 2026-05-16 | Service account (not OAuth) for Reports tab Google API auth | Scott + validator gate | Avoids 4-6 week sensitive-scope verification |
| 2026-04-11 | PROJECT_MANIFEST.md replaces session-context .md files | Scott | Process standard |
| 2026-04-10 | Mailboxes: Resend sends from noreply@pestflow.ai; reply-to varies by type | Scott | (since deprecated — Google Workspace) |
| 2026-04-10 | Dang custom domain verified=false until Kirk confirms DNS | Scott | No premature DNS flip |
| 2026-03-xx | Archive before delete — soft-archive pattern | Scott | No hard deletes without archive step |

---

## Session Log

| Session | Date | Key Completions |
|---------|------|-----------------|
| S1–S107 | Mar 2026 | Full platform build, all 4 shells, Dang shell, multi-tenancy |
| S108–S117 | Mar–Apr 2026 | Marketing landing, bundle.social, SMS hotfixes, Dang content restore, custom domain routing, mailbox wiring, support ticket system, 5 HTML email templates, pg_cron scheduled posts |
| S118–S221 | Apr–May 2026 | (Manifest backfill pending — see SuperClawed session handoff thread. Major work includes Next.js shell ports, S142.7 image schema rename, S171 Stripe automation removal, S203 demo tenant seeds, S209 legal apex routes, S212 security sprint, S213c-B 27-fn edge audit, S217 webhook auto-provision LOCKED, S218 Zernio image attach fix, S219 LinkedIn+TikTok composer, S220 provision-tenant v72, S221 provisioning observability suite PR #80) |
| S222 (in progress) | 2026-05-16 | Reports tab Google APIs planning + GCP migration to Ironwood Workspace (paused mid-session for framework upgrade) |
| Framework v3.1 upgrade | 2026-05-16 | This session. Branch: `chore/upgrade-framework-v3-1`. Adds `.claude/hooks` (require-pr, protect-files, session-end), `.claude/commands` (office-hours, investigate, qa, review, ship), `.github/workflows/ci.yml` (Validate gate), `GIT_RULES.md`, PR template. Merges settings.json: preserves curated permissions, removes `Bash(git push origin main)`, adds hooks block. Customizes protect-files.sh for env/doppler/migrations/auth-shared/provisioning/stripe/RLS paths. Auto-merge available at repo level but disabled per-PR by default. |

---

## Session Boot Command (v3.1)

```bash
doppler run -- claude --dangerously-skip-permissions \
  "Pre-flight: read CLAUDE.md, GIT_RULES.md, SKILL.md, PROJECT_MANIFEST.md.
   Read the last 3 Session Log entries in PROJECT_MANIFEST.md.
   Verify .claude/settings.json exists and require-pr hook is active.
   State: Current Phase, Task ID, current Branch (or to-be-created),
   proposed plan in 3–5 bullets.
   If scope is unclear: invoke /office-hours.
   Do not touch any file until I confirm the plan."
```

---

## Key File Paths (S117 state — confirmed still valid for non-Next.js admin paths)

```
src/pages/admin/Dashboard.tsx          ← Client admin shell
src/pages/IronwoodOps.tsx              ← Ironwood CRM shell
src/components/admin/SupportTab.tsx    ← Support tickets (client side)
src/components/ironwood/SupportPanel.tsx ← Support inbox (Scott side)
src/pages/CustomPage.tsx               ← Public custom page renderer
src/pages/SlugRouter.tsx               ← Routes /:slug
src/components/admin/ContentTab.tsx    ← Content editor + New Page modal
src/shells/dang/                       ← Full custom Dang shell
src/lib/shellThemes.ts                 ← CSS custom property shell definitions
supabase/functions/provision-tenant/   ← Full tenant provisioning (PROTECTED)
supabase/functions/ironwood-provision/ ← JWT wrapper (PROTECTED)
supabase/functions/stripe-webhook/     ← (PROTECTED)
supabase/functions/create-checkout-session/ ← (PROTECTED)
supabase/functions/_shared/auth/       ← (PROTECTED) Shared auth modules (C2 pattern)
```
