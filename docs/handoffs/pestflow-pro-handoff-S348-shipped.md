# PestFlow Pro — Session Handoff S348

**Date:** 2026-09-05
**Arc:** S334 → S348. The operator-identity arc, the scrape that wrote fiction, and **the first lawn
client.**
**Deploy state:** **SHIPPED AND LIVE. THE DEPLOY/APPLY QUEUE IS EMPTY.** Every edge function that
carries the change is deployed, and the `faqs` unique key is applied.

Deploy state read from production and from the **deployed bundles**, per the rule S345 earned the hard
way. Times UTC, 2026-09-05.

---

## VERIFIED LIVE STATE

| object | state |
|---|---|
| `scrape-prospect` | **ACTIVE v58**, `verify_jwt=false`, deployed **15:10:54** — seventeen seconds after the #356 merge. Bundle read: carries S348's removed write, S347's `pageFilter.ts`, S346C's `unreachable`. |
| `offboard-tenant` | **ACTIVE v15**, `verify_jwt=true`, deployed **14:43:11**. Bundle read: gates on `isIronwoodOperator(svc, user.id)`; `OPERATOR_ID`/`OPERATOR_EMAIL` gone from `_shared/offboardDrain.ts`. **It no longer denies the only real operator.** |
| `ai-proxy` | **ACTIVE v25**, deployed **13:07:09** — 31s after the S346 merge, by the `_shared/` redeploy workflow. |
| `ironwood-provision` / `provision-tenant` | **v64** / **v108**, both `verify_jwt=false`, unchanged this arc. |
| `public.faqs` | `faqs_pkey (id)`, `faqs_tenant_id_fkey`, **`faqs_tenant_question_key UNIQUE (tenant_id, question)` — APPLIED. NO MIGRATION FILE.** |
| `admin_delete_tenant` | md5 **`54937fa95988c4cc7ec401b2b10be307`**, length **4730** — still exactly the anchor the S348 file was written against. |

### The `_shared/` blast radius, resolved by import graph rather than by version number

`_shared/` is a redeploy trigger path, so *which* functions actually carry the change was verified:

- **`_shared/aiAuth.ts` — exactly ONE importer, `ai-proxy`.** Deployed. ✅
- **`_shared/operatorLookup.ts` — exactly TWO, `offboard-tenant` and `scrape-prospect`.** Both deployed. ✅

The other **15** functions in `.github/edge-shared-consumers.txt` still show 2026-09-04 timestamps.
**That is correct, not a gap:** none import either module, so the CLI found no change and skipped the
upload. A version number that did not move is evidence of nothing on its own.

---

## GRANDVIEW — THE FIRST LAWN CLIENT, PROVISIONED AND VERIFIED

`grandview` / **Grandview Lawn and Landscape**, tenant `95f1f4f1-484d-4a9c-bcb2-cc4e8cb97a00`,
`vertical = 'lawn'`, created **13:58:11.887463**. **The first tenant provisioned in a vertical other
than pest or irrigation** — the whole S332→S341 lawn chain, exercised for real.

**ELEVEN tenant-scoped tables were written in ONE transaction.** `settings`, `page_content` and
`tenant_services` all carry the tenant's own creation timestamp to the microsecond —
`13:58:11.887463` — which is `provision_tenant_atomic` committing as a unit, not a sequence of writes:

| table | rows |
|---|---|
| `settings` | 12 |
| `seo_meta` | 18 |
| `page_content` | 16 |
| `ai_authority_prompts` | 10 |
| `tenant_services` | **7** |
| `service_areas` | 7 |
| `profiles` / `tenant_users` / `prospects` / `provisioning_status` / `outbound_integration_queue` | 1 each |

`tenant_services = 7` is the S341/S342 per-service picker working end to end: seven selected, seven
rows, out of a 17-entry lawn catalog.

**THE TWELFTH TABLE IS `faqs`, AND IT IS THE WHOLE ARGUMENT FOR THE NEXT SESSION.** Its 35 rows share
one identical timestamp, **`14:12:43.7602` — fourteen and a half minutes after provisioning committed.**
**Provisioning did not write them, and never has.** They were a **one-off backfill applied by hand by
Claude.ai over MCP** after the tenant existed.

**PROVISIONING WRITES ELEVEN TENANT-SCOPED TABLES. `faqs` IS THE TWELFTH, AND PROVISIONING HAS NEVER
WRITTEN IT.** That is the gap FAQ seeding closes, and it is why it is Next Up.

---

## WHAT SHIPPED

| session | change | state |
|---|---|---|
| **S346** | one operator identity, read from `public.operators` (#353) — `44c768c` | **LIVE** |
| **S346B** | `scrape-prospect` made vertical-aware — paths, slugs, both prompts (#353) | **LIVE** |
| **S347** | the 404 filter (#354) — `fb5ab0b` | **LIVE** |
| **S346C** | the frontend gate, the sidebar, the hidden section, the counters (#355) — `161cffb` | **LIVE** |
| **S348** | Discard, two migration files, FAQ seeds (#356) — `aa1d537` | **LIVE** |

**Migrations applied since the S345 handoff:** S346/S346B/S346C/S347 were **code only — no DDL.** S348
backfilled `s343b` and `s345` as files (both md5-verified). The one live-but-unfiled object is
`faqs_tenant_question_key`, in the follow-ups below.

### S346 — operator truth had drifted into being its own opposite

`IRONWOOD_OPERATOR_USER_IDS` held **only** `admin@pestflowpro.com`; `public.operators` held **only**
`scott@homeflowpro.ai`. Verified by id, not by label. Whichever identity was used, something 403'd —
`scrape-prospect` returned Forbidden twice and Firecrawl was never called. The fix is one reader,
`_shared/operatorLookup.ts`, and **not** a fifth list. It fails closed, and `data` is deliberately not
trusted when `error` is set, so a driver returning both cannot authorize anyone.

### S346B — the scrape was pest-only and told the model the wrong trade

`CANDIDATE_PATHS` was 18 hardcoded pest paths, `pathToSlug` mapped only pest slugs, and **both prompts
opened by asserting "pest control"** at a lawn company. Paths and slugs now come from the vertical's
catalog entry; the trade noun comes from `VERTICAL_COPY`, which falls back to "home services" —
naming no trade rather than the wrong one.

### S347 — nine of ten "pages found" were the same 404

Established by re-fetching the site: `GET /ant-control` returns **`metadata.statusCode` 404** carrying
the site-wide og:title. `scrapeOne` only checked `res.ok` — **the status of the Firecrawl call, which
succeeds because Firecrawl successfully fetched a 404.** The og:title made each error page look real
and `pc.title || pc.intro` let it through. `provision-tenant` overlays `scraped_content` onto
`page_content` at create time, so those rows were **one Create Site away from a client's public
website.** The status check is exact; the homepage-duplicate check (Dice ≥ 0.9) is the secondary net.
**Absent status is deliberately NOT an error** — discarding a real page costs something unrecoverable.

### S346C — four defects, and the sixth allowlist

- **The frontend gate.** `IRONWOOD_ALLOWED` was hardcoded in `IronwoodLogin.tsx` **and again** in
  `IronwoodOps.tsx`. Both gone, replaced by `src/lib/isOperator.ts` → `is_operator()`.
- **The sidebar lied.** The footer rendered the literal `admin@pestflowpro.com` instead of
  `session.user.email` — it showed one identity while the session held another, and **misled a real
  login check.**
- **`SiteSetupSection` was HIDDEN on the `firecrawl_migration` build path** — the very path Grandview
  came in on. A migration prospect could not reach the slug, admin-email or admin-password inputs at
  all. A test now pins that it is reachable unconditionally.
- **The counters did not reconcile.** The live run reported "23 paths tried, 1 real page saved (9
  skipped)" — 13 unaccounted for, the paths where `scrapeOne` returned null before the filter ever saw
  them. `unreachable` closes it: **`tried = unreachable + discarded + kept`.**

**Owner decision, recorded:** `murphygurl92@gmail.com` has no `auth.users` row and is in neither
`public.operators` nor `aiAuth.ts`. **Removed, not created.**

### S348 — discard means discard

> *"Discard was never clicked because the results were never accepted, and the rows sat there anyway."*

**Wiring Discard alone would not have prevented the incident.** Both halves shipped: the write moved to
the point of acceptance (the function no longer writes `scraped_content` at all — `ScrapePanel`
persists on **Apply**), and Discard *also* clears what earlier runs left behind. Both fail visibly.

`s345` is DROP+CREATE — the `RETURNS TABLE` signature changes and REPLACE raises 42P13 — and reissues
the ACL, **without which the migration would silently widen who can claim queue rows.**

---

## THE FAQ SEEDS — BUILT AND TESTED, NOT WIRED

`shared/lib/faqSeeds.ts` keys seeds by **slug**, deriving the category from the catalog at build time,
because the same slug carries different titles per vertical (`sprinkler-systems` is "Irrigation Repair"
under lawn, "Sprinkler Systems" under irrigation). Storing the category alongside the FAQ would be
wrong for one of the two.

| vertical | provenance |
|---|---|
| **LAWN** | lifted **verbatim** from grandview's 35 rows — 7 services |
| **IRRIGATION** | pls's rows **minus its 3 'General' entries** — licence number, founding year, warranty term: tenant facts, the exact counter-example |
| **PEST** | grounded in dang's 55 — 9 species + a general set |

**Region is a tenant fact.** Nearly every dang answer is region-locked — "East Texas humidity", "in
Tyler", "the Piney Woods". Each seed keeps the *mechanism* and drops the geography; a test scans for the
region terms. **Termite is deliberately NOT seeded** — dang has no termite FAQs, so there is nothing to
ground `termite-control` or `termite-inspections` in.

**NO TENANT HAS EVER RECEIVED FAQs FROM PROVISIONING.** Every FAQ row in the database was loaded outside
that path — dang 55, pls 10, and grandview 35, the last being a **one-off backfill by Claude.ai over
MCP**, 14 minutes after the provisioning transaction committed. **The seven tenants that got
provisioning and nothing else have zero**, while carrying 12 service rows each.

---

## OPEN, IN PRIORITY ORDER

1. **WIRE FAQ SEEDING.** The blocker is gone: `faqs_tenant_question_key` is applied, so `buildFaqRows`
   goes into `provision_tenant_atomic` / `buildPayload` with a real `ON CONFLICT (tenant_id, question)`
   target. Grandview is the proof it is needed — a hand-load, fourteen minutes after the transaction
   that should have done it.
2. **`s348_faqs_tenant_question_unique` HAS NO MIGRATION FILE.** Applied live; the repo has no record.
   Same class as `s343b` and `strip_settings_secrets`. **It is the conflict target item 1 depends on**,
   so a fresh database would fail to seed without it.
3. **Termite FAQs need authoring** — a source, not a generation pass.
4. **The operator-access decision** (ROADMAP) is still open and still gates JW Customs.

---

## WORKING RULES THIS ARC EARNED

**1. `is_operator()` GIVES OPPOSITE VERDICTS DEPENDING ON THE CALLER, AND UNIFYING THE TWO CALL SITES IS
AN OUTAGE.** It resolves the caller as `auth.uid()`. In the browser that is the signed-in user and the
function is exactly right — it returns a bare boolean and never ships the operator list. Under
service_role `auth.uid()` is **NULL**, so the same call denies **everyone** — a failure that looks
precisely like working code. The edge path must read `public.operators` directly and the browser path
must call the function. **These are not duplication to be cleaned up.** Anyone who "unifies" them
breaks one side, and which side depends on which direction they unify.

**2. NARROW-SCOPING A SEARCH BEFORE IT HAS FOUND ANYTHING IS HOW THE FIFTH ALLOWLIST SURVIVED S346.**
Six operator allowlists existed. The sixth — `_shared/offboardDrain.ts`, gating the function that
**deletes tenants**, and already broken — was found only because the S346C scan was **deliberately too
broad first**. That broad pass failed on ten files, nine of them legitimately (support mailtos, the
published demo login, transactional email footers, legal text), and it was narrowed *afterwards*, to
allowlist-shaped constants plus the eight files that make an authorization decision. Scope the search to
the answer, never to the guess.

**3. THREE NEW VACUOUS-GUARD SHAPES, all found by mutation:**
- **Import-line satisfaction** (S347) — an "X before Y" scan was satisfied by the symbol appearing in
  the `import` statement.
- **Comment self-trip** (S346C) — the explanatory comment naming `IRONWOOD_ALLOWED` made "the literal is
  gone" fail on a correct edit. Every assert now strips comments first, and needles are assembled from
  fragments so the test file is not itself a hit.
- **Property guaranteed by a different function than the one the defect lives in** (S348) — a planted
  pest fallback in `faqSeedsFor` passed, because the assertion ran through `buildFaqRows`, which calls
  `catalogFor` first and returns `[]` for an unknown vertical regardless. Assert against the function
  the defect would live in.

**4. A SUBSTRING TEST IS NOT A PROOF OF ABSENCE.** `user_roles` still appears in `admin_delete_tenant`
— in the **comment recording its removal**. Anchor on `md5(pg_get_functiondef(...))`. The same shape
recurred this session in a different costume: grepping `aiAuth` matched `_shared/aiAuthority/`, a
different directory, and nearly recorded `ai-authority-worker` as an undeployed carrier of the old
operator set. **Anchor on the full import specifier, not the token.**

**5. FIXING THE OBSERVABLE TRIGGER IS NOT FIXING THE INCIDENT.** Discard was the reported defect;
Discard was never clicked. The *timing* of the write was the cause.

**6. dang is a SEPARATE REPO and stayed untouched all arc.**
