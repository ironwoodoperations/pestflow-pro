# PestFlow Pro — Handoff S279 (vertical architecture: registry + generic shells SHIPPED)

*Session S279 · two code PRs merged and production-verified. S278 was the pls tenant build (`pestflow-pro-handoff-S278-pls-vertical.md`, PR #263); this session generalized what that build hardcoded.*

## What shipped

### PR #264 — vertical registry + JSON-LD vocabulary wiring (merged `e8df0de`)
Opened `Vertical` from a closed `'pest' | 'irrigation'` union to a string registry, added the copy-preset registry, and wired JSON-LD vocabulary per vertical. No visible copy changed.

Production-verified: apex-protect, urban-strike and vita-glow all still emit the historical six-term pest `knowsAbout` array in exact order; pls now emits the eight irrigation terms. pls's whole-page pest count dropped to hostname-only occurrences. **The JSON-LD `knowsAbout` array was the last pest artifact on the pls public site.**

### PR #265 — generic shells + DB-driven about stats (merged `b00e68f`)
Every remaining hardcoded-pest surface on the public site now resolves through the preset chain, plus two defect fixes. +827/−91, 20 files, 217 tests.

Production-verified: pest tenant location page unchanged on every checked string; pls location page fully irrigation; quote h1s correct per vertical (`Request a Free Estimate` vs `Schedule a Free Inspection`); `/reviews` free of `client_site` / `google_outscraper`; no about stat block anywhere. **Two misses found — see OPEN.**

---

## ARCHITECTURE NOW IN PLACE

    vertical preset (code)  →  tenant DB override  →  render

Read this section before extending anything. It is designed so a new vertical is a one-line change plus two presets.

### The layers, bottom up

**`shared/lib/verticals.ts` — the BOTTOM layer.** Owns `VERTICALS` (`pest`, `irrigation`, `lawn`, `pool`, `hvac`, `roof`, `trailer`), the `Vertical` type derived from those keys, `isVertical`, and `resolveVertical`.

It lives here, not in `src/shells`, because of a layering decision worth not re-litigating: **`shared/` must never import `src/`.** The dependency graph is `app/ → src/shells`, `app/ → shared/`, `src/ → shared/` — `shared/lib` is the bottom and depends on nothing internal above it. Putting the registry in `src/shells` and importing it from `shared/lib/seoSchema` would have closed a cycle (`src/ → shared/ → src/`). `shared/lib/verticals.test.ts` **scans every file in `shared/lib` for a `src/` import and fails if one appears**, and asserts `verticals.ts` is a leaf with no internal imports at all. There is no cycle-detection tooling (`madge`/`dpdm`) in this repo, which is why the invariant is asserted against the source directly.

**`src/shells/_shared/serviceEntry.ts`** re-exports `Vertical`, `resolveVertical`, `VERTICALS` and `isVertical` from `shared/lib/verticals`, so its consumers import from exactly where they always did and did not change.

**`src/shells/_shared/verticalCopy.ts`** holds **15 copy slots** (location hero suffix / subtitle / H2 / intro / CTA, `cityFaqs`, `whyChooseFeatures`, `processHeading`, `processSteps`, `serviceProcessVerb`, `serviceSolutionLabel`, `serviceSteps`, `serviceAreaStrapline`, `quoteHeroTitle`, `metadataFallbackDesc`). Accessor `getVerticalCopy` is **Partial + throw**.

**`shared/lib/seoSchema.ts`** holds the frozen vocabularies and `getSchemaVocabulary`, same Partial + throw shape. Vocabularies are `Object.freeze`d because `generateLocalBusinessSchema` emits `knowsAbout` **by reference** — an unfrozen array can be mutated process-wide by any caller holding an emitted schema.

`{city}` tokens in preset copy are substituted at render by `withCity`.

### Adding a vertical
1. One line in `VERTICALS` (`shared/lib/verticals.ts`).
2. A preset in `verticalCopy.ts`.
3. A vocabulary in `seoSchema.ts`.

TypeScript then flags every consumer that must be updated — that is the point of deriving the type from the registry rather than maintaining a union by hand. A registered key with no preset **throws**, loudly, naming the vertical; it never silently serves pest copy.

---

## THE TWO RULES

Both were learned the hard way this session. State them to anyone extending this.

### a) A preset holds ONLY what is true of the whole TRADE
Tenant facts — warranty terms, licence numbers, region, BBB rating, scheduling promises — belong in the DB, never in a preset. Precision's 2-year warranty, `LI23001`, "East Texas" and "BBB A+" all appear on that tenant's site and are all deliberately **absent** from the irrigation preset.

**VIOLATED ONCE.** The irrigation preset shipped `whyChooseFeatures[3]` as *"Fast & Reliable — Same-day and next-day appointments available."* — a capability claim the client never made, which also contradicted the irrigation city FAQ that was deliberately written to promise nothing. Caught in review and corrected to *"Clear Scheduling — We give you a firm date, keep you posted if anything changes, and show up when we say we will."* — a conduct claim about the trade rather than a capacity claim about a business.

A regex guard now blocks the class on the irrigation preset: `/same-day|next-day|24\/7|guarantee/i`, plus `/LI23001|East Texas|2-year|two-year|BBB/i` for tenant facts. Note the guard is **irrigation-only** and cannot be widened to both presets as-is, because the live pest preset legitimately contains `— guaranteed.`

### b) NEVER fabricate
The modern-pro about stat block hardcoded four tiles: `5,000+ Properties protected` and `24/7 Response window` (both invented), `100% Guarantee`, and a `15+ Years operating` **fallback that invented fifteen years of trading for any tenant with no `founded_year`**. All removed.

`settings.about` drives it now. `auto:years_operating` computes from `founded_year` and **drops the tile** when that is absent, unparseable, zero, or in the future. Malformed entries are skipped, not rendered as `undefined`. More than four truncate. **No stats configured renders NO block. There is deliberately no fallback tile and there must never be one.** Rendering nothing is correct; inventing a number is not.

---

## FAIL-LOUD, AND ITS COST

`getVerticalCopy` and `getSchemaVocabulary` both throw, and both are called from `layout.tsx`. Consequence, stated plainly: **a tenant set to a registered-but-copyless vertical 500s the ENTIRE site** — and it is triggerable by a JSONB edit to `settings.business_info.vertical` with no deploy involved.

That was chosen deliberately over the alternative, which is serving pest copy to a pool company. A wrong-trade page that looks fine is worse than an obvious outage.

**A CHECK constraint on `business_info.vertical` is the planned guard and is NOT yet applied.** Until it is, the blast radius of a typo in that field is a whole tenant site. Today only `pls` has the key set at all (`irrigation`); every other tenant is `null` and reaches the industry fallback.

---

## DISCOVERY LESSON

The keyword grep for `pest` **missed five surfaces**, because pesticide language does not reliably contain the word "pest":

- `EPA-approved, low-impact formulations`
- `concentration levels`
- `IPM-compliant materials`
- `calibrated to species, severity`
- the verb `How we treat`

Reading **rendered production copy** found them. The same failure repeated at the end of this session: the post-merge production check found `Same-day appointments available.` and `Schedule Inspection` still live on the pls location page, from `CtaBanner.tsx` — a component whose offending strings contain no pest word at all, so no grep over the location branch could ever have surfaced them.

**Do the rendered-copy pass in Phase 2, not just a grep.** A keyword search cannot find a fabricated claim; only reading the page can.

---

## OPEN / NOT DONE

### Found by the #265 production check — live on the client site now
- **`_components/sections/CtaBanner.tsx` is not vertical-aware.** Line 13 renders `Same-day appointments available.` unconditionally for every tenant, and line 17 renders the pest CTA label `Schedule Inspection`. Both are live on `pls/tyler-tx`. The same-day string is the exact class of claim rule (a) exists to prevent, and it survived PR B because `CtaBanner` was not in the workstream list. Fix is two more slots (`ctaStrapline`, `ctaPrimaryLabel`) threaded through its **two** callers (homepage default branch, location branch).
- **`/images/pests/team.jpg`** is referenced by the pls `/about` hero — a pest-vertical asset path on the irrigation site.

### Carried
- **`settings.about` seed for pls + ISR cache purge.** Until seeded, EVERY modern-pro tenant renders no stat block. Shape: `{ "stats": [ { "value": "auto:years_operating", "label": "Years operating" }, { "value": "LI23001", "label": "Texas Irrigator License" } ] }`. Per the standing rule, the cache purge ships in the same turn as the SQL.
- **CHECK constraint on `business_info.vertical`** + the migration-file chore PR.

### Backlog
- `ModernProAboutPage` `FALLBACK` intro paragraphs still claim *"same-day response and a 100% guarantee"* — rule (a) violation in the same file WS7 cleaned.
- `reviews/page.tsx` `'☆'.repeat(5 - r.rating)` throws `RangeError` for a rating above 5. Latent, not live: 67 rows, min 4, max 5, zero nulls. Same one-line clamp as the #251 testimonials fix.
- `ModernProPestPage` retains `'Pest Control'` / `'Pest'` string fallbacks on `heroTitle` and `eyebrow`. Unreachable in practice — the `[service]` router only admits slugs present in the vertical's content map, so `pest?.displayName` is always defined on a rendered service page.
- About stat tiles are keyed on `label`; two tiles with the same label collide in React's key space.
- Two PR A assertions were loosened `toEqual` → `toMatchObject` when the preset grew from 4 slots to 15. The full set is locked by `verticalCopyPresets.test.ts`; the loosened pair still locks the original four.

### Client-blocked (Dathan)
Sprinkler tile photo (currently **licensed stock**), warranty scope, pond-pump permits, real hours. **Hours stay BLANK** — the GBP "Open 24 hours" is a platform default, not a fact. `pls` is `noindex: true` sitewide.

---

## PHASE 2 NEXT — genericize the admin SPA

**Discovery pass FIRST, no code.** And per the lesson above, that pass reads rendered admin screens, not just greps.

The admin surface is still hardcoded pest for every tenant: the Content editor lists `pest-control` / `termite-control` / `spider-control`, and the hero placeholder reads *"Professional Pest Control You Can Trust"*.

**Admin gets its OWN copy preset file.** Admin labels and public-site copy are different vocabularies with different audiences and different change cadences — do not share one registry between them.

Related, now visible to clients: the admin SPA's `<title>` is still `PestFlow Pro`, and since #261 the modern-pro footer copyright links every tenant straight to `/admin`, so it is the first thing a client sees in their browser tab.
