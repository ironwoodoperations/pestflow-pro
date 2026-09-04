# PestFlow Pro — Session Handoff S331

**Date:** 2026-09-04
**Arc:** S321 → S331.
**Deploy state:** S321–S331 all merged. S321–S330 are deployed; **S331 merged as `0c2f01f`** ([#340](https://github.com/ironwoodoperations/pestflow-pro/pull/340)) and is Next.js code, so it goes live with the production build that merge triggers.

This is for orientation, not archaeology. If you are picking this up cold, read the production state
first, then the open list. The session log is in `PROJECT_MANIFEST.d/`.

---

## PRODUCTION STATE

**pls — Precision Lawn Systems — is LIVE and INDEXABLE on `precisionlawnsystems.com`.** It is the
platform's first custom-domain client, and it is earning.

| | |
|---|---|
| canonical | the **apex**; `www` 301s to it |
| old platform subdomain | 301s to the custom domain, **preserving path AND query** |
| sitemap | **14 URLs** |
| lead capture | verified **end to end** |
| Zernio profile | `6a9acaa74c4070ad859de8e4`, created **by the platform** — it was NULL before, so the S329 lazy-create path ran |
| email | **never went down.** MX, SPF and all three DKIM records untouched throughout |
| admins | both pls admins have `profiles` rows; `scott@homeflowpro.ai` resolves to `pestflow-pro` |

Other tenants: **dang** (separate repo — see the boundary note below), **vita-glow**, five demo
tenants, and the operator tenant `pestflow-pro`.

---

## WHAT SHIPPED

Deploy timestamps are from the platform, and the bundles were read — not inferred from a version bump.

| session | change | deployed |
|---|---|---|
| **S321** | `api-quote` origin admission rebuilt: **URL parsing, not regex**. A verified `tenant_domains` lookup sits behind the platform check and behind a throttle, so custom domains are admitted without opening a per-request query. | v38, 2026-09-02 23:03 UTC |
| **S321B** | canonical host resolution; old-subdomain 301 preserving path and query; per-tenant sitemap. | live |
| **S322** | six tenant routes gained `generateMetadata` — they had been inheriting the layout's canonical and telling Google they were duplicates of the homepage. A **route-walking** guard fails when a newly added route regresses. | live |
| **S325** | the demo tier switcher and SocialTab upgrade nudges now gate on `settings.demo_mode.active === true`, not a hostname test. They had been rendering on **every custom domain**. | live |
| **S326** | `provision-tenant`: password reset is **opt-in** (`reset_admin_password`, default false) — it had been resetting a live admin's password and killing their sessions on every re-provision; `ai_authority_prompts` unique constraint + upsert; `ZERNIO_API_KEY` absence made observable. | v105, 2026-09-04 14:32 UTC |
| **S327** | `scripts/deploy-function.sh` freshness guard; `session-end.sh` skips protected branches. | live |
| **S329** | `zernio-connect`'s **auth hole CLOSED** — it had no caller authentication at all and queried with the service-role key from a body-supplied `tenantId`. Now `requireTenantAdmin`, with the frontend sending the JWT. Plus lazy Zernio profile creation, a tenant-correct return URL, and the vendor's name out of client-facing strings. | v39, 2026-09-03 19:50 UTC — **`requireTenantAdmin` confirmed present in the deployed bundle** |
| **S330** | `provision-tenant` settings writes **MERGE instead of replace** at all three sites. `businessInfoMerge` moved to `shared/lib` so `provision-tenant` is finally under the S292 guard it had never been under. | with S326 in v105 |
| **S331** | ONE canonical publicly-listed-service predicate across nav, tiles, sitemap and quote form. | merged `0c2f01f` |

`post-to-social` v68, `publish-scheduled-posts` v70 and `zernio-analytics` v28 went out alongside S329.

**A premise proven in production:** the deployed `zernio-connect` bundle carries
`shared/lib/resolveSiteUrl.ts` **and its non-leaf dependency `canonicalHost.ts`**, both verbatim. Until
this arc, only *leaf* cross-tree modules had been shown to bundle. Cross-tree imports work — **with an
explicit `.ts` extension**, which Deno requires.

---

## OPEN, IN PRIORITY ORDER

### 1. THE RPC — the next session

Atomic provisioning through one Postgres function.

- **Auth FIRST, then the transaction.** This is forced, not chosen: `profiles.id` **IS** the auth user
  id and `tenant_users.user_id` references it, so there is no id to write until gotrue answers.
- A **selection table** with **server-side catalog validation**.
- The backend **rejects an empty selection**; a zero-services tenant renders **200**.
- **The DB-side single-statement settings merge deferred from S330 belongs inside this function.** S330
  shipped the closest safe alternative available without a migration and explicitly did **not** claim
  the validators' lost-update guarantee. Do not assume it is closed.

### 2. S323 PR C — admit `'lawn'` to `settings_business_info_vertical_valid`. LAST.

The ordering is load-bearing. `getVerticalCopy` **throws** for a vertical with no preset and is called
from `layout.tsx`, so setting a tenant to `'lawn'` before the presets land **500s that tenant's entire
site via a JSONB edit, with no deploy involved.**

### 3. Grandview provisions.

---

## RECORDED, NOT BUILT

- **21 of 37 `_shared` consumers are missing from `.github/edge-shared-consumers.txt`** — the S273
  stale-bundle failure, still open. **`provision-tenant` is one of them**, so adding it to that list
  ships whatever is unreleased at that moment as a side effect.
- **Six consumers unpinned in `config.toml`** (`api-quote`, `zernio-connect`, `send-sms`,
  `send-credentials-email`, `send-reveal-ready`, `scrape-prospect`). All six deployed `false`, all six
  **correct** at `false`. `config.toml` is itself a workflow trigger path.
- **`provision-tenant`'s `liveUrl` and legal-page seeding still build `.com` hosts**, as do
  `send-reveal-ready:76` and `send-credentials-email:215`.
- **The legal-page host should resolve at render time**, not be persisted at write time.
- **`page_content` has NO `published`/`active`/`status` column.** A per-page visibility flag is a future
  need, deliberately not invented.
- **`invite-salesperson`: DEPLOYED v52 ACTIVE with NO SOURCE IN THE REPO**, gated on
  `admin@pestflowpro.com` whose credentials are published on the marketing site. The owner has decided
  the marketing login stays — **so the function is what must change.**
- **MULTI-TENANT PROFILE LIMIT.** `profiles.id` is the PK and IS the auth user id, so
  `current_tenant_id()` resolves one user to exactly ONE tenant, while `tenant_users` is many-to-many.
  Live consequences: `scott@homeflowpro.ai` **cannot reach vita-glow**, and `admin@demo.com` is admin on
  all five demo tenants but resolves to one, so **four demo dashboards cannot be logged into**. Fixing
  `current_tenant_id()` to read `tenant_users` with an active-tenant selector is **the same problem as
  the operator-access decision**. Gated.
- **Zernio hygiene.** The team is **shared with Ritual and Texas Pro Trailer Rentals** — separate
  businesses, separate repos — and account IDs validate **team-wide**. Scoped API keys before more
  clients connect. Billing is **per connected account, not per profile**; profiles are free.
  $6/account/month at 1–10, $3 at 11–100, first $12 per period free.
- **Idempotency keys, optimistic locking, `verify_jwt` hardening** — deferred by the S323 gate.
- **`REVIEW_S321` appendices are still empty.** Verdicts were summarised, never pasted.
- **Four comments claim the Supabase CLI bundles only `supabase/functions/**`. They are false** — see
  above. **Three of the four live inside `supabase/functions/_shared/`, so correcting them fires the
  redeploy workflow and republishes 16 functions.** Its own task, not a drive-by.
- **S324 report §5 line numbers have drifted**: `560/739/654` → `607/812/723`. **Do not edit the
  report** — it is a point-in-time record.

---

## WORKING RULES THAT EARNED THEIR KEEP

These are not general advice. Each one is here because ignoring it cost something in this arc.

**1. Verify the artifact, not the status.** Three deploys on 2026-09-02 reported success while shipping
stale bytes; one of them 403'd lead capture for **every `.ai` tenant, platform-wide**, with the function
still reading ACTIVE. The S327 guard has since caught two more. A version bump and a green deploy are
not evidence — read the bundle.

**2. A guard that cannot fail is worthless.** **Five** of CC Web's own guards were found vacuous by
mutation testing across S326–S331, each time *before* shipping: an assertion satisfied by a sibling
call, `%q` quoting that no test exercised, a scan whose regex matched nothing, render tests where
`import.meta.env.DEV` made every case pass. Mutate every guard and confirm it fails for the *right*
reason.

**3. Line numbers in older documents drift.** Confirm by reading. Three consecutive briefs cited numbers
that had moved.

**4. `github:search_code` returns false negatives and cannot establish absence.** Walk the tree. It has
under-reported every time it was checked — S327 expected 2 deploy headers and the walk found 24.

**5. Briefs have been wrong on load-bearing premises, repeatedly. Say so and stop rather than
implementing around it.** Two caught this way: **S328's** premise about the redeploy workflow (it
deploys a hardcoded list, not the import graph, so the stated risk was not live — while a *larger* one
was), and **S331's** predicate (which as specified would have stripped vita-glow's three service pages
from nav, tiles, sitemap and quote form while the router kept rendering them). Both would have shipped
silently if implemented as written.

**6. dang is a SEPARATE REPO, mid-migration, and out of scope.** Its data is in this database and is
useful as evidence — its `wasp-control` row is the live proof behind S331 — but its public site is not
rendered by this app. Read it, cite it, leave it alone.

---

## ONE CORRECTION TO THE S332 BRIEF

**RESOLVED ON MERGE — #340 merged as `0c2f01f` shortly after this was written. Kept, because the
point it makes does not depend on the outcome.**

It listed S331 as shipped and live, and said "MERGED, NOT YET DEPLOYED: nothing." **When this handoff
was written that was false** — `main` was at `18e4205` (S330) and #340 was still open. The local suite
reporting 1593 tests rather than S331's 1614 surfaced it before the PR state was even checked.
Everything else in that list was checked and holds.

That is rule 1 applied to the brief itself, and the reason to keep it: the brief was confidently wrong
for about twenty minutes, and a document written from it during that window would have been wrong for
much longer.
