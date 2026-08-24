# PestFlow Pro — Handoff S290 (the vertical architecture reaches provisioning — and everything is DEPLOYED)

*Session S290 · three PRs merged (#283, #284, #285) · the trade is now recorded at the point a human
supplies it · every pest default in the provisioning path is gone · VAPI is decommissioned · and for
the first time in this arc, **nothing is left inert**.*

---

## Read this first: MERGED IS NOT DEPLOYED — and this time it IS deployed

"Merged is not deployed" has been the recurring trap of this whole arc. It produced a wrong claim about
`generate-monthly-report` that survived several sessions and had to be corrected twice.

**This close is different. Everything is live.**

| thing | state | how verified |
|---|---|---|
| `provision-tenant` | **v99, ACTIVE, `verify_jwt:false`** | `get_edge_function` — all five files confirmed in the **deployed** source: `index.ts`, `provisioningSeed.ts`, `authorityPrompts.ts`, `verticalCopy.ts`, `service-areas.ts` |
| `generate-monthly-report` | **v11, ACTIVE, `verify_jwt:false`** | `get_edge_function` |
| `ai-authority-dispatch` cron | **`0 4 1 * *` (monthly)** | applied via MCP; S290's migration file now records it |
| four fabricated-phone rows | **cleaned** | `claims_content_sweep.sql` returns **zero** |
| `voice-intake` (VAPI) | **DELETED** | absent from `list_edge_functions` |

There is no "…but it still needs deploying" line in this handoff. That is the point of putting this
section first.

### Method note, now a durable rule

`provision-tenant` was deployed via the **Supabase CLI from the Codespace**, not via MCP. It is ~1,100
lines; hand-transcribing it into a tool call carries silent-corruption risk with no upside, while the
CLI bundles straight from git, byte-exact. Verification stayed on the MCP side via `get_edge_function`,
because that reads the **deployed** source rather than the local one.

> **Rule: large functions deploy via CLI, MCP verifies.** The two halves are doing different jobs — one
> transports bytes, the other confirms what actually landed. Using MCP for both means the thing that
> checks the work is the same thing that could have corrupted it.

---

## What shipped

| PR | |
|---|---|
| #283 | **S287** — the stat-pair guard's own blind spot; the caption prompt's hardcoded region. Both carried items closed. |
| #284 | **S289** — AI Authority prompt generation, seeding, backfill and the editing surface that never existed. |
| #285 | **S290** — de-pest provisioning; capture the vertical where a human supplies it. |

`main` green after each. **Lint baseline held at 223.** Test count **709 → 802** across the three.

---

## S290 — what a pool company got yesterday

```
page_content.home.title       "Blue Ridge Pools — Professional Pest Control"
page_content.home.subtitle    "Licensed & insured professionals. Fast, effective results."
page_content.about.subtitle   "Locally owned and operated."
page_content                  twelve pest service pages
seo_meta home                 "…Licensed technicians, fast response, guaranteed results.
                               Call for a free quote."
seo_meta about                "Family-owned, fully licensed and insured."
seo_meta pest-control         "…Fast, effective, guaranteed."
seo_meta termite-control      "Free inspections available."
settings.seo                  "Professional pest control services by … and surrounding areas."
service_areas.hero_title      "{city} Pest Control"      ×  every zip-guessed draft city
service_areas.meta_desc       "…Licensed, insured, and locally trusted."
blog_posts                    "Top 5 Signs You Have a Pest Problem"  ×3
business_info.industry        "Pest Control"   (hardcoded default — both wizards AND the edge fn)
business_info.vertical        —                (never written, zero occurrences)
```

**Two distinct violations in one function.** A trade nobody recorded, *and* a stack of claims nobody
made: a licence, insurance, family ownership, response speed, guaranteed results, and two free offers —
written to the database before anyone had spoken to the customer.

This is why S290 was the keystone. Every genericization in S279–S289 operated on content this function
had already created.

### Capture

The vertical is resolved **once**, before a single row is seeded, and **validated before the write**.
`settings_business_info_vertical_valid` accepts `'pest' | 'irrigation' | NULL`; anything else is
rejected with 23514 *inside a settings upsert that logs the error and carries on* — leaving a tenant
provisioned with no vertical and nobody aware. It now returns a **400 with the reason**.

Absent / `null` / `''` is **not** an error. The constraint permits NULL, and "the operator did not pick
one" is a real state that must seed neutral rather than be rejected.

Deliberately **not** read from `intake_data`: that overlay runs *after* `page_content` is written, so
honouring a vertical there would seed one trade's pages and record another trade's name.

**A select, not a text box.** `industry` is already free text and that is exactly why nothing could ever
key on it — `pls`'s stored value is a 154-character service description, vita-glow's is "Medical
Aesthetics". The "Not listed / other" option is a **real answer**, not a prompt to dismiss.

### Seed from the preset

New pure module `supabase/functions/_shared/provisioningSeed.ts` (86 tests) builds every seeded string
from the vertical.

| | pest | irrigation | **unknown** |
|---|---|---|---|
| home title | `X — Professional Pest Control` | `X — Professional Irrigation` | **`X`** |
| service pages | 12 | 5 | **0** |
| `focus_keyword` | `pest control tyler` | `irrigation hawkins` | **`''`** |
| service-area hero | `Tyler Pest Control` | `Hawkins Irrigation` | **`Tyler`** |
| any trade named | yes | yes | **no** |

Not even the neutral `home services` appears for an unknown vertical — that is a description of the
*platform*, not of this tenant's trade.

**The claims are deleted, not reworded.** No safer-sounding replacement. A subtitle the tenant has not
written is **empty**, which is S286's precedent applied again: *with the field empty the template cannot
be used — no default, no placeholder that reads as an offer.*

Starter blog posts are gated to `vertical='pest'`. They are **authored articles, not labels** — "Top 5
Signs You Have a Pest Problem" under a pool company's byline is the same defect as the page titles, but
writing irrigation equivalents means writing content. Any other vertical gets **no** starter posts: an
empty blog, not someone else's blog.

---

## Two live-state facts that cost real debugging time

### PLS was HALF-BOUND — and the class is real

`pls`'s **`profiles` row was missing entirely**, and has been inserted.

`current_tenant_id()` reads `profiles.tenant_id`. With no row, every RLS-gated read returned empty and
every write failed. The symptoms looked like unrelated bugs:

- Locations showed **0 of 5** real service areas
- hero-image upload failed with *"new row violates row-level security policy"*

`tenant_users` was correctly bound **the whole time**, which is what made it confusing.

> **There are TWO PARALLEL BINDING MECHANISMS.** `provision-tenant` populates both — but `pls` predates
> that, so **any tenant created outside `provision-tenant` may be half-bound.**

Worth an actual check across all nine tenants. Not an assumption in either direction.
`tenant_role_binding_drift` is the audit view built for exactly this.

### PLS tier — write BOTH columns, and know which one gates

`tenants.entitlement = 3` **and** `settings.subscription.tier = 3`. Both, deliberately.

> **`PlanContext` and `check_tenant_access` both read `tenants.entitlement`.** `settings.subscription` is
> **display metadata**.

Changing only the settings row changes the **label** and not the **lock** — the dashboard says Pro while
the gates still enforce the old tier. That mistake was made and corrected this session, which is why it
is written down rather than assumed obvious.

Note the interaction with the S289 finding below: `ai_authority_dispatch` reads
`settings.subscription.tier`, the *display* column. That is the wrong one.

---

## VAPI is decommissioned — a decision carried across seven sessions, now closed

Since S279 this handoff series has carried *"which provider does the live Remi number ring?"* as **a
decision only Scott can make**, blocking warm-transfer work and leaving two ACTIVE handlers on one
number.

**Done, and executed:**

- VAPI phone number and assistant **deleted** in the VAPI dashboard
- `voice-intake` edge function **deleted** — confirmed absent from `list_edge_functions`
- `vapi_assistant_id` / `vapi_phone_number_id` **stripped** from `settings.voice_receptionist`
- **Retell is the sole provider**

> **The fact that made this safe, and that no amount of repo or MCP inspection could ever have
> surfaced: the Remi number was a TWILIO number that VAPI had merely imported.** Deleting the VAPI
> record therefore could not take the live line down.

That is worth keeping as a reasoning lesson, not just an outcome. The session repeatedly reported this
as unresolvable-from-here, and it *was* — but "unresolvable from here" meant the answer lived in a
provider dashboard, not that the answer was risky.

**Still unwritten:** `voice-intake-retell` has **no transfer branch at all**. Warm transfer is a fresh
build, not a parked one. S289's VAPI-key report is now moot — the keys are gone and so is their only
reader.

---

## THE DURABLE LESSON — eighth occurrence, and it now has a stricter form

> **A guard's scope quietly stops matching its claim.** A green guard with the wrong scope reads as
> proof and is not.

The running tally:

1. `seo_meta` / `service_areas` / `settings.seo` — data, not source
2. Vita Glow's pest metadata — `generateMetadata`, not body copy
3. `BoldLocalAboutPage`'s `4,200+ Customers` — source, but split across two object fields
4. The vitest suite itself (S284) — 535 tests that had never gated a PR
5. S285's slug lists — scoping to `src/app/shared` would have dropped four suites under `supabase/functions/`
6. **S281's own DB sweep** — it reported **"0 remaining"** and was *correct about the three tables it
   scanned*, while four rows carrying that number sat in two tables it never looked at
7. S287's stat-pair guard — tested per line, so one Prettier reflow silenced it
8. S289's city assertion — an alternation, green on output covering two of five cities

### The stricter form: a guard that CANNOT FAIL is not evidence

Three of the eight are this sharper thing — not mis-scoped, but **incapable of failing**:

| | what happened |
|---|---|
| **S287 M5** | Gutting the file walk entirely **failed no test.** The repo had zero offenders, so the scan passed without scanning. |
| **S289 M6** | Dedupe **could not fire** on any real tenant's inputs. The uniqueness assertion passed without testing uniqueness. |
| **S289 M20** | An alternation assertion passed on output covering **two of five cities** — the whole suite green, 36/36, on the broken output. |

S289 M6 is the most instructive: investigating *why* the mutation was green exposed a **real defect** —
three independent `i % n` cycles never produce cross pairs for small inputs. The vacuity was not just a
weak test; it was hiding a bug.

### The structural answers so far

| session | answer |
|---|---|
| S286 | **Anti-drift check** — the tables the sweep SAYS it covers must equal the tables it actually queries. |
| S287 | **Injectable reader** — the file walk's own removal becomes detectable. |
| S290 | **Non-trivial-corpus assertion** — `allSeededStrings()` returning `[]` would make all 49 forbidden-pattern assertions pass, so a separate test requires >8 strings per case and >40 for the pest case, and each of the seven patterns is *also* fired against a string that should violate it. |

> **Every new guard should carry one.** The question to ask is not "does this pass?" but "what would I
> have to delete for this to stop passing?" If the answer is "nothing", it is not evidence.

**Carried as its own follow-up:** any existing scan-style guard that currently finds nothing cannot
detect its own deletion. S286's `composerTemplateSets` source scan is one. That audit is open.

---

## The second lesson: substring over-match, three occurrences

Every one against **this codebase's own vocabulary**:

| pattern | matched | where |
|---|---|---|
| `/pest/i` | **Pest**Flow Pro | S283 narration guard |
| `/pest/i` | **Pest**Flow Pro | S282 admin classifier (shipped with it) |
| `/free/i` | **free**ze | S286 first-pass offer guard |

> **Future guards assume word boundaries.** `\bfree\b`, not `/free/`. And mask the product name before
> scanning for trade vocabulary.

S290's forbidden-pattern set was written this way from the start, and the vacuity test confirms each
pattern still fires.

---

## Open / pending (carried to next)

### S292 — NEXT. `handleLaunch` drops TWELVE `business_info` keys

`Onboarding.tsx` writes `business_info` as a **whole replacement value**. S290 preloaded `vertical` so
that one survives. The rest still go. **Verified against live data — twelve, not the seven reported
mid-session:**

```
address_country   address_locality  address_region   street_address
postal_code       latitude          longitude        geocode_source
timezone          founded_year      certifications   num_technicians
```

- **`founded_year` is what `settings.about`'s `auto:years_operating` resolves from.** It is how PLS's
  "9+ years" renders on the public site.
- **`certifications` and `num_technicians` are tenant claims** the S281 architecture deliberately put in
  the DB rather than in a preset.
- The in-code comment justifying the omission covers the **nine** address/geo/timezone keys and **does
  not cover those three**.

> **THE FIX IS MERGE, NOT ENUMERATE.** Read the current `business_info`, spread it, overlay the form
> fields. That kills the class rather than the twelve instances — and removes the need to maintain a
> list of which keys are safe to drop, a list that was already wrong the moment `vertical` was added.

### S291 — unblocked

Deferred behind S290 by its own brief: *"that one is a live fabrication path for every future customer;
this is an enhancement."* `provision-tenant` is deployed, so the dependency is satisfied. Constraints
still stand: no new direct `api.anthropic.com` callers; stop and report if `ai-proxy` cannot forward
`tools`; do **not** flip `adapter_enabled`; repo only, no deploy; do not rewrite `parseClaude`; the cron
stays monthly.

### Still pest — each its own brief

`generateBlogDraft.ts` · `useSeoAiGenerate.ts` · `SeoAioTab.tsx` · **`seoSchema.ts`** · `LocationsTab.tsx`
· `scrape-prospect` · the Ironwood dashboard components · Review Spotlight's assumed 5-star review · and
the three pest starter blog posts, now correctly gated to `vertical='pest'` but still the only starter
content that exists.

**`seoSchema.ts` is the one to look at first** — it is Vita Glow's **indexable** pest metadata. A live
wellness clinic is emitting pest vocabulary to crawlers.

### 138 is a search result, not an audit

A repo-wide search for `"pest control"` outside `docs/` returns **138 files**. Many hits are legitimate:
Dang's own shell, the PestFlow Pro marketing site, legal templates, and the removal comments this arc
wrote.

> **Record it as unclassified. Do NOT present 138 as a defect count.** Run an S282-style discovery pass
> to classify before scoping any of it. Quoting the raw number as a backlog would be the same category
> error as a mis-scoped guard: a number that reads as a finding and is not.

### `ai_authority_dispatch` — wrong tier column, and no filtering

Reported in S289, not fixed:

- It resolves tier from **`settings.subscription.tier`** (`COALESCE(…, 1)`) rather than
  `tenants.entitlement`, which S262 latched `NOT NULL` as the single source of truth. Per the PLS note
  above, that is the **display** column.
- It loops over **every** row in `tenants`. Nothing excludes demo or operator tenants — the only thing
  keeping them off the paid engines is that they have no prompts, which makes S289's two gates
  load-bearing rather than belt-and-braces.

A DB-side guard in dispatch is the durable fix. S291's companion migration is the natural place.

### Carried unchanged

- **Three content tables nothing sweeps for claims** — `page_content.*`, `faqs.question/.answer`,
  `reviews` / `team_members` / `campaigns`. Named in `claims_content_sweep.sql`'s DOES NOT COVER block on
  purpose: they are where to look when the sweep returns clean and a claim still reaches a page.
- **143 stamped migrations have no file.** `apply_migration` records a version without writing one.
  S290's migration deliberately does **not** attempt this — reconstructing 143 statements from live
  schema is its own job, and doing it half-way is worse than leaving it legible.
- **`branding.cta_text` defaults to `"Get a Free Quote"`**, and the wizard placeholders are
  pest-flavoured (`"Apex Pest Solutions"`, `"Your local pest experts"`, `"TPCL-12345"`). Placeholders are
  never written to the DB, but they bias the operator toward pest.
- **PROJECT_MANIFEST hook costs a second commit and a second CI run per PR.**
