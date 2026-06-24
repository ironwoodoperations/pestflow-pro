# PestFlow Pro — S274 Handoff (Dang revalidation arc · STATE DOC)

**Date:** 2026-06-24 · **Session:** S274 · **Type:** investigate / docs-only (no app code changed this session)

> This handoff records the resolved incidents from the Dang revalidation arc, the current
> verified live state, and the outstanding cleanup chores. **Nothing in this doc is a
> live-site code change** — see the "Dang SEO mechanism finding" section for why the live
> Vite site is intentionally left untouched and the migration (roadmap `dang-pfp`) is the
> real fix.

---

## Business state (record accurately)

PestFlow Pro is **production-ready and at idle capacity** right now. Active leads out —
**Capture, Blue Duck, and a TOPS contact** — all awaiting responses. **No new tenant
onboarding is in flight.** This idle window is the rationale for scheduling the Phase 0
onboarding-pipeline rehearsal in the roadmap (`dang-pfp`).

**Dang Pest Control is the only live customer.** It is a **SEPARATE-REPO Vite SPA**
(`ironwoodoperations/dang-pest-control` → **dangpestcontrol.com**), live and ranking well
for ~3 months. It reads the **SHARED PFP Supabase** (`biezzykcgzkrwdgqpsar`), tenant_id
**`1611b16f-381b-4d4f-ba3a-fbde56ad425b`**. CRM, lead forms, and reporting all work
against the shared DB.

---

## Dang SEO mechanism finding (record as the TRUE state — this is the load-bearing fact)

Source: `docs/audits/dang-revalidation-investigation.md` and the SEO field-flow follow-up.

**Dang's dashboard SEO/content edits are largely NOT crawler-visible.** The mechanism:

- The Dang site is **client-rendered** (`react-helmet-async`, **no SSR / SSG / prerender**).
  Vercel serves **one generic `index.html` head for every URL**.
- AI crawlers (**ChatGPT / GPTBot, Perplexity, ClaudeBot**) see only that static head —
  they do not execute the post-hydration helmet swap.
- **`/contact` and all 12 pest pages are hardcoded components** that **shadow** the
  dynamic DB-reading path and **never read the `seo:/<slug>` rows the dashboard writes**
  (compounded by a **leading-slash key mismatch**: dashboard writes `seo:/x`, the read
  path looks up `seo:x`).
- **Only home and about honor dashboard SEO, and only post-hydration** (so still invisible
  to non-JS crawlers).

**Net:** Dang's working SEO is carried by **HARDCODED build-time values**, not by the
dashboard. This is **NOT a bug to hotfix on the live site** — it is the *reason for the
planned migration*. The live Vite site stays as-is. The fix is the SSR rebuild tracked in
`docs/ROADMAP.md` as **"Dang → PestFlow Pro Next.js migration (dang-pfp)."**

---

## Resolved incidents this arc

**(a) `requireTenantUser` `profiles.role` → `tenant_users` 403.**
After the S273 SSOT reroute (all tenant-context edge fns read role from `tenant_users`
keyed to the requested tenant), some consumers were still running the pre-reroute bundle
and returned **403** for legitimate admins. **Fixed by redeploying the affected
consumers** so the live bundle matches the rerouted `_shared/auth/requireTenantUser.ts`.

**(b) `check_tenant_access` PGRST203 overload ambiguity.**
Two `check_tenant_access(...)` overloads existed simultaneously, so PostgREST could not
resolve the call and returned **PGRST203 (ambiguous function)**. **Fixed by collapsing to
a single integer overload** — live via MCP migration
**`s273_collapse_check_tenant_access_to_single_integer_overload`**. ⚠️ **This migration
is live in the DB but has NO repo trail yet — a repo-trail PR is still OUTSTANDING** (see
cleanup chores below).

**(c) `post-to-social` confused-deputy cross-tenant fix.**
A cross-tenant confused-deputy path in `post-to-social` was closed (caller must be admin
of the requested tenant; tenant id validated against `tenant_users`, not derived).
**Deployed as v64.**

---

## Current verified state

- **Edge function versions:** `ai-proxy` **v19**, `apply-finding-fix` **v2**,
  `post-to-social` **v64**.
- **Dang entitlement = 4 (Elite)** — **correct.**
- **SEO "Generate fix" now returns 200** (verified in `ai_proxy_log`) — the proxy/edge
  path is healthy end-to-end. **BUT the generated output does NOT surface on the live Vite
  pages**, per the Dang SEO mechanism finding above (hardcoded routes shadow the
  `seo:/<slug>` rows; client-only render invisible to crawlers). The 200 confirms the
  *backend* works; it does not mean the edit is live to a crawler.

---

## Outstanding cleanup chores (RECORD ONLY — do NOT do them this session)

1. **Repo-trail PR for the collapse migration** (incident b). Add the
   `s273_collapse_check_tenant_access_to_single_integer_overload` SQL to the repo so the
   live state has a source trail. In the same PR:
   - **Neutralize the earlier `20260622170000` add-integer-overload migration** so a
     from-zero replay leaves **exactly ONE overload** (not two — which would re-create the
     PGRST203 ambiguity on replay).
   - **Tighten grants to `service_role`-only** on the collapsed function.
2. **Dang repo `config.toml` stale project link** — currently linked to
   **`bqavwwqebcsshsdrvczz`**; should be **`biezzykcgzkrwdgqpsar`** (the shared PFP
   Supabase). Repo-config hygiene; no live-data impact, but fix before any CLI op against
   that repo.
3. **Optional PFP dashboard UX honesty fix** — label/hide the SEO + content edit fields
   that **Dang's hardcoded routes don't read**, so the dashboard doesn't imply an edit
   went live when it didn't. Optional / cosmetic; the real fix is the `dang-pfp`
   migration.

---

## Open / pending (carried to next)

- **`dang-pfp` migration** — the Next.js SSR rebuild that makes dashboard SEO real and
  crawler-visible. Newly added to `docs/ROADMAP.md` as a gated multi-phase project;
  **Phase 0 (idle-capacity onboarding-pipeline rehearsal) is scheduled to run NOW** while
  awaiting the Capture / Blue Duck / TOPS responses. Live Dang site stays untouched until
  parity is proven; DNS/301 cutover is a separate gated decision.
- The three cleanup chores above (collapse-migration repo trail, Dang `config.toml`
  relink, optional dashboard UX honesty fix).
- Pre-existing carry-forwards from S273 remain open (production health monitoring, demo-
  deauth wave, Remi warm transfer) — see `docs/ROADMAP.md`.
