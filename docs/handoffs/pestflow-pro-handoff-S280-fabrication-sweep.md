# PestFlow Pro — Handoff S280 (fabrication sweep: Phase 1 COMPLETE)

*Session S280 · two code PRs merged and production-verified, one open. S279 (`pestflow-pro-handoff-S279-vertical-architecture.md`) built the vertical registry and genericized the shells; this session finished the job by removing what the registry could not fix — invented content and unverified claims living in ordinary components.*

**If you have no context on this arc, read this first:** PestFlow Pro is a white-label site platform. One codebase renders every client's public site, and until recently that codebase assumed every client was a pest control company. S278 onboarded the first non-pest client — Precision Lawn Systems (`pls`), an irrigation contractor — which turned every hardcoded pest string into a visible defect on a live client site. S279 built the architecture to fix that class properly. S280 finished it, and found a second, worse class along the way: content that was not merely the *wrong trade*, but **not true of anyone**.

---

## What shipped

### PR #267 (PR C) — fabricated blog posts deleted, vertical genericization finished (merged `7e37748`)

**The severe defect: `blog/page.tsx` carried a `PLACEHOLDER_POSTS` array.** Three invented, dated articles — *"5 Signs You Have a Termite Problem"*, *"How to Prevent Mosquitoes"*, *"Brown Recluse Identification"* — rendered for **any** tenant with an empty `blog_posts` table. That included `pls.pestflowpro.ai`, a live client site: an irrigation contractor was publishing three pest-control articles it had never written, with fabricated publication dates.

The array was **deleted**, not swapped for irrigation-flavoured placeholders. A tenant with no posts now gets one honest line and no cards. The Blog link is hidden in both the header nav and the footer Quick Links when a tenant has no published posts, resolved once in `layout.tsx` and passed to all nine navbar/footer components.

Also fixed in the same PR:
- **`CtaBanner` was not vertical-aware.** It rendered `Same-day appointments available.` and the pest label `Schedule Inspection` unconditionally — live on all five `pls` location pages. Now prop-driven from the preset through both of its callers.
- **Blog card, blog post banner and about hero images** resolve per vertical or render nothing. The irrigation slots are **`null`**: `public/images/pls/` holds only the five service tiles (`drainage`, `pump-systems`, `retaining-walls`, `sod-dirt-work`, `sprinkler-systems`). There is no irrigation team photo and no irrigation generic photo, so nothing renders rather than borrowing pest photography. `/images/pests/team.jpg` was live on the `pls` about hero until this PR.

### PR #268 (PR D) — capacity-claim literals retired across every CtaBanner variant (merged `829ef0c`)

Two sibling shell banners — `BoldLocalCtaBanner` and `CleanFriendlyCtaBanner` — each hardcoded, identically:

> *"Same-day and next-day appointments available. No contracts required."*

A response-time promise plus a contract-terms promise, on every bold-local and clean-friendly homepage, verified for no tenant. Both now take an optional `strapline` prop **with no default**, and the paragraph is guarded — because here the former string *is* the defect, so defaulting to it would reintroduce exactly what the PR retires.

**The preset regex guard was SPLIT.** The capacity terms — `/same-day|next-day|24\/7|no contracts/i` — now apply to **every populated preset**, not just irrigation. The guarantee term stays irrigation-only, because the pest preset legitimately carries `— guaranteed.` in `whyChooseFeatures`, and a test asserts that exception so it stays visible and can be removed the day it stops being true.

The pest `ctaStrapline` became **`Every visit starts with an inspection.`** — grounded in that preset's own `processSteps[0]`, which is `Inspection`, and asserted by a test so it is a description of conduct rather than a rhetorical claim.

---

## PHASE 1 IS COMPLETE

**The `pls` public site carries no pest vocabulary, no pest imagery, no fabricated content, and no unverified capacity claim on any of its 16 routes.**

Verified by fetching rendered production pages, not by grep. That distinction is the point — see the lesson below.

---

## THE DURABLE LESSON

**Three consecutive PRs found the same defect class in a place the previous guard could not see, because the guard was scoped to PRESETS while the literals lived in COMPONENTS.**

- PR B's guard scanned the preset registry → PR C found the class in `blog/page.tsx` and `CtaBanner.tsx`.
- PR D's guard scanned the presets plus one component family → PR E found it in thirteen more components, and **in the preset registry itself**, under a pattern the earlier guard did not test for.

#269's repo-wide scan is the first guard whose **scope matches the defect's shape**. It walks every `.ts`/`.tsx` under the tenant public render path rather than a hand-listed set of files.

> **When a guard finds nothing, check whether it is looking where the defect lives.** A green guard with the wrong scope is more dangerous than no guard, because it reads as proof.

**Related, and pulling the other way: a guard with false positives gets allowlisted into uselessness.** The pattern `/within \d+ hours/` was **dropped** from #269 rather than shipped, because it cannot distinguish

- *"Safe for pets, effective within 24 hours"* — treatment efficacy, a **trade fact**, which stays; from
- *"You receive a written WDI report within 48 hours"* — business turnaround, a **tenant fact**, which was deleted.

Both read identically to a regex. Judgment-dependent cases are handled **by hand**, with an explicit test naming each one, not automated into a pattern that will be suppressed the first time it cries wolf.

---

## THE TWO RULES

Carried forward verbatim from S279. State them to anyone extending this.

### a) A vertical preset holds ONLY what is true of the whole TRADE
Tenant facts — warranty terms, licence numbers, region, BBB rating, scheduling promises — belong in the DB, never in a preset. Precision's 2-year warranty, `LI23001`, "East Texas" and "BBB A+" all appear on that tenant's site and are all deliberately **absent** from the irrigation preset.

### b) NEVER fabricate — rendering nothing is correct, inventing is not
No fallback tile, no fallback post, no fallback stat, no default claim. If a slot has nothing true to say, it renders nothing.

### The addition this session earned

**The preset registry itself was found carrying a fabricated statistic.**

`src/shells/_shared/verticalCopy.ts:124` — `Local Experts`: *"We know the local pest pressures in your area **and have treated thousands of properties just like yours.**"* Live on every pest tenant's homepage via `WhyChooseUs`.

**The layer built to be the trustworthy source was not exempt from the rule it exists to enforce.** It survived PR D specifically because that PR's guard tested only the capacity class, and this is a fabricated-statistic claim. Do not assume the preset is clean because it is the preset.

---

## OPEN — #269 (PR E) is NOT merged and NOT production-verified

**Status: draft, all four checks green, awaiting Scott's review.** 23 files, 340 tests. Nothing in this section is live.

- **Repo-wide guard** at `shared/lib/noUnverifiedClaims.test.ts`, scanning `app/tenant/**` and `src/shells/**`. The scope is **structural, with no allowlist and no named exceptions** — admin and Ironwood copy is excluded by where the scan looks, not by a list that can quietly grow. It lives in `shared/lib/` so the root `tsc --noEmit` typechecks it.
- **26 fixes: 13 deleted outright, 13 clause-removed.** A claim about a specific business (response time, contract terms, customer counts, dispatch windows) is deleted — there is no tenant fact behind it to move to the DB. A clause that merely qualified a true sentence is removed, and the true remainder kept verbatim.
- **Two dead files deleted** after verifying zero references repo-wide: `CleanFriendlyTrustBar.tsx` and `QuoteFormSteps.tsx`.
- **The shared `CtaBanner`'s defaults are removed entirely** — `DEFAULT_STRAPLINE`, `DEFAULT_GENERIC_INTRO`, `DEFAULT_PRIMARY_LABEL` were all pest strings on a multi-vertical component, unreachable once both callers passed explicit props, and a claim by accident the moment one caller stopped.

**Scott has NOT yet ruled on two deletions made under the rule but outside the brief:** `serviceData.ts:158` and `:160`, both *"fast turnaround"*. The reasoning was that deleting the specific *"within 24 hours"* promise while leaving the vague version two lines above would leave the page promising speed anyway — the "vaguer version of itself" the rule forbids. Reversible if he disagrees.

---

## PR F — identified, not started

Three shells still hardcode fabricated statistics:

- `app/tenant/[slug]/_components/DefaultAboutPage.tsx:30` — `15+ Years Experience` / `4,200+ Homes Protected` / `98% Customer Satisfaction`
- `app/tenant/[slug]/_shells/clean-friendly/CleanFriendlyAboutPage.tsx:102-104` — the identical trio
- `BoldLocalPestPage` — `100% Guarantee` and `15+ Years on the job`

Same fabrication class as everything above. The #269 pattern **misses them** because it requires `properties|customers` after the number and these say `Homes`.

**This is NOT a copy edit.** These shells were never converted to DB-driven `aboutStats` the way modern-pro was in PR B — they take no `stats` prop at all. They must be **wired to `settings.about`**, with the same contract: `auto:years_operating` computes from `founded_year` and drops the tile when it is absent, unparseable, zero or in the future; malformed entries are skipped; more than four truncate; **no stats configured renders no block, and there is deliberately no fallback tile.**

---

## QUEUE, in order

1. **Merge + production-verify #269.**
2. **PR F** (above).
3. **`settings.about` seed for `pls`** — with the ISR cache purge in the **SAME turn, no exceptions**. Shape:
   ```json
   {"stats":[{"value":"auto:years_operating","label":"Years operating"},
             {"value":"LI23001","label":"Texas Irrigator License"}]}
   ```
   Defensible facts only, maximum 4 tiles. **Until this is seeded, EVERY modern-pro tenant renders no stat block.**
4. **CHECK constraint on `settings.business_info.vertical`,** restricted to the copy-complete verticals (`pest`, `irrigation`). `getVerticalCopy` and `getSchemaVocabulary` both throw and are both called from `layout.tsx`, so **a JSONB edit to a copyless vertical 500s an entire tenant site with no deploy involved.** Then the migration-file chore PR — `apply_migration` stamps `schema_migrations` but writes no file to `supabase/migrations/`.
5. **Phase 2 — admin SPA discovery pass. NO CODE.** Inventory every string as **VERTICAL / TENANT / PLATFORM**. Read rendered admin screens, not greps. **Admin gets its OWN copy preset file** — admin labels and public-site copy are different vocabularies with different audiences and different change cadences. Do not share the public-site registry.

---

## STATE CORRECTIONS — verified this session, supersede prior docs

- **There is NO `demo` tenant.** The six platform pest tenants are `apex-protect`, `coastal-pest`, `heartland-pest`, `metro-pest-concierge`, `urban-strike`, and `pestflow-pro` (the master tenant serves a full public pest site).
- **Theme map:** `modern-pro` = apex-protect / dang / pls · `metro-pro` = metro-pest-concierge / pestflow-pro · `bold-local` = urban-strike · `clean-friendly` = coastal-pest · `rustic-rugged` = heartland-pest · `vita-glow` = vita-glow.
- **The "pest byte-identical" invariant is RETIRED as of #268. Do not restate it.** It was a proxy for *"don't regress pest tenants"*, and it held usefully across PRs A–C. It stopped being useful the moment the pest copy itself was the defect: **deleting fabricated content from demo sites is the rule working, not failing.** No paying client is on this code path for pest — Dang is `render_model=standalone` with a separate repo.
- **Blog post counts:** `dang` 29, `pestflow-pro` 4, every other tenant 0.

---

## LOGGED, UNFIXED

- **`layout.tsx` calls `getAllBlogPosts` with `.select('*')` to compute a boolean.** It pulls full article bodies on every route to decide whether to show a nav link — 29 post bodies per ISR regeneration for Dang. Should be a head/count query.
- Carried from S279: `reviews/page.tsx` `'☆'.repeat(5 - r.rating)` throws `RangeError` for a rating above 5. Latent, not live — 67 rows, min 4, max 5, zero nulls.
- Carried from S279: about stat tiles are keyed on `label`; two tiles with the same label collide in React's key space.

---

## CLIENT-BLOCKED (Dathan — not build work)

Real sprinkler photo (the current tile is **licensed stock**), warranty scope, pond-pump permits, real hours.

**HOURS STAY BLANK.** The GBP "Open 24 hours" is a platform default, not a fact. `pls` is `noindex: true` sitewide; nothing is being crawled.
