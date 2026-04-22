# S165.9 — seo2 design doc v2 LOCKED

**Session:** S165
**Task:** seo2 — JSON-LD schema injection for Next.js tenant shells
**Status:** v2 LOCKED post Perplexity + Gemini validation gate
**Supersedes:** `s165-9-seo2-design-v1.md`
**Next artifact:** `s165-9-seo2-claude-code-prompt.txt` (execution prompt for Claude Code CLI)

---

## 1. Gate resolution summary

Two validators independently reviewed v1. Decisions frozen below.

### Convergences (both validators agree)

| Decision | Locked choice | Notes |
|---|---|---|
| D1 — Injection mechanism | **D1-A** inline `<script type="application/ld+json" dangerouslySetInnerHTML>` server-component | Metadata API is for meta tags, not scripts; `metadata.other` is brittle for this use |
| D3 — Hours handling | **D3-D** parser v1 + structured migration v2 | Migration hard-scheduled as seo2.5, not indefinite |
| D4 — Address handling | **D4-D** same pattern as D3 | Same session as hours migration |
| D8 — Generator location | **D8-B** move `src/lib/seoSchema.ts` → `shared/lib/seoSchema.ts` | No Deno boundary, duplicate-with-sync would recreate the drift class S164 just solved |
| D9 — Duplicate-key source preference | **D9-A** `business_info` wins over `seo` for v1 | Short-lived; b15 resolves properly with CHECK constraint |
| Parser failure | **Omit the affected sub-block entirely** | Never emit malformed schema. Log server-side warning. |

### Divergences resolved

**D5 AggregateRating** — direct conflict resolved in Perplexity's favor.

- Perplexity: skip entirely v1 (D5-D). Reasoning: Demo has 8/8 at 5.00 (seed-inflation pattern Google's 2026 spam filters punish), CityShield has 0. Skipping is zero-downside with verified-provenance substrate.
- Gemini: ship with count ≥ 5 gate (D5-B). Reasoning: gate filters thin data.
- **Resolution: D5-D.** Gemini's gate filters CityShield correctly (0 → skip) but allows Demo's exact policy-risk data to emit (8 ≥ 5 → passes). The gate doesn't protect against the actual threat. Defer AggregateRating until a real review ingestion pipeline with provenance exists (the Zernio Google Reviews wire is the natural future substrate).
- **Precedent match:** S164 deferred Dang JSONB backfill when Gemini argued caution vs Perplexity conditional safety. Same pattern.

**D7 Review placement** — direct conflict, moot with D5-D.

- Perplexity: D7-B (reviews page only).
- Gemini: D7-A (inline in LocalBusiness.review[]).
- **Resolution: deferred with D5-D.** No reviews emitted v1. Provisional choice for future: **D7-B** on Perplexity's duplication-surface-area argument. Revisit when reviews ship.

**D6 Min-review threshold** — moot with D5-D. If revisited, internal floor of 5 is reasonable but is not a policy guarantee — eligibility and provenance matter more than count per Perplexity.

### Structural modification (Perplexity correction to v1)

**D2 — Schema placement** changed from v1 default:

- v1 default: LocalBusiness + WebSite both in layout
- Perplexity correction: WebSite conceptually belongs to site root, not every leaf route. Emitting it globally is semantically sloppy and unnecessary.
- **Locked: D2-A MODIFIED.** Layout emits LocalBusiness only. Home page.tsx (and only home) emits WebSite. Everything else page-specific.

---

## 2. New requirements surfaced by gate (not in v1)

Five requirements the validators flagged that must bake into implementation:

### 2.1 XSS injection escape (Perplexity)

**Requirement:** The JsonLdScripts server component must escape `<` characters before injection:

```ts
const safe = JSON.stringify(schema).replace(/</g, '\\u003c');
return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safe }} />;
```

**Why:** User-entered fields (`business_info.tagline`, `business_info.name`, FAQ answers) can legally contain `<`. An attacker who compromises the admin UI or a future XSS in the settings form could inject `</script><script>evil()</script>`, escaping the JSON-LD context into live JS. The `\u003c` replacement keeps JSON valid AND prevents breakout. Non-negotiable.

### 2.2 Stable `@id` pattern (Gemini)

**Requirement:** LocalBusiness @id must be a stable URI that other page-level schemas reference:

```json
{ "@type": ["LocalBusiness", "PestControlService"], "@id": "https://cityshield.pestflowpro.com/#organization", ... }
```

Page-level Service blocks then reference back:

```json
{ "@type": "Service", "provider": { "@id": "https://cityshield.pestflowpro.com/#organization" }, ... }
```

**Why:** Without `@id`, Google treats layout-level LocalBusiness and page-level Service provider as two separate entities. With `@id`, it stitches them into one business graph. This is the signal for "the service provider on this page is the same business as in the global LocalBusiness block."

Implementation: `shared/lib/seoSchema.ts` helpers take `siteUrl` (already do) and emit `@id: \`${siteUrl}/#organization\``. Service generator's `provider` block emits `{ "@id": \`${siteUrl}/#organization\` }` instead of inline LocalBusiness repetition.

### 2.3 GeoCoordinates missing (Gemini) — deferred to seo2.5

Local Map Pack ranking signal. `business_info` has no `latitude`/`longitude` columns today. Adding geo schema requires:
- Admin form field for lat/long OR Google Places API lookup on address save
- Schema migration adding `geo` to business_info substrate

Defer to **seo2.5** alongside D3-C/D4-C structured address+hours migration. Same session is natural — all three touch the same admin form and substrate.

### 2.4 Schema type validity (Perplexity) — T0 verify

**Requirement:** Before using the existing generator's `@type: ['LocalBusiness', 'PestControlService']`, verify `PestControlService` is a recognized schema.org type in 2026.

**T0 action:** Claude Code web-searches `schema.org/PestControlService` before T1 work begins.

**Decision tree:**
- If recognized → keep existing multi-type chain
- If not recognized → replace with `@type: ['LocalBusiness', 'HomeAndConstructionBusiness']` per Perplexity's suggestion
- If neither → fall back to bare `LocalBusiness`

Document the resolution in T0 verification report.

### 2.5 Parser omit-over-malform (both converge)

**Requirement:** Every parser in the new generator library returns `undefined` or skips the sub-field on failure. Generator call sites omit the enclosing property when the parser returns undefined.

```ts
// parseHours returns OpeningHoursSpecification[] | undefined
const spec = parseHours(raw);
if (spec) schema.openingHoursSpecification = spec;
// else: omit openingHours entirely, do NOT fallback to free-text as-is
```

Applies to: hours parser, address parser, any future geo coordinate parser, any future phone E.164 normalizer.

Log server-side warning via Vercel logs when a parser omits so admins can see which tenants have malformed data. Warning format: `[seo2] parseHours("...") returned undefined for tenant=<slug>, omitting openingHoursSpecification`.

---

## 3. Final locked task plan

Same T0–T6 structure as v1. Changes:

### T0 — Pre-flight verification (read-only, Claude Code web-search + grep)

- T0.1: Web-search `schema.org/PestControlService` 2026 status → recognized type or fallback?
- T0.2: Grep repo for `SchemaConfig.aggregate_rating` callsite — document where it's sourced today (for knowledge; not used v1 per D5-D)
- T0.3: Grep for services substrate — confirm `service_pages` vs other table name
- T0.4: Grep for social_links source (settings key or dedicated table)
- T0.5: Verify `seo.meta_description` populated for CityShield + Demo via Supabase MCP
- T0.6: Confirm Next.js tsconfig path resolution — can App Router reach `src/lib/*`? Answer informs whether the T1 move is a rename or a cross-import unlock
- T0.7: Verify FAQs and testimonials admin routes render visible content on `/faq` and `/reviews` — FAQPage emission policy (Perplexity) requires on-page visibility

### T1 — Shared lib relocation + additions

- T1.1: `git mv src/lib/seoSchema.ts shared/lib/seoSchema.ts` in one commit along with all importer path updates (atomic)
- T1.2: Add `@id` pattern to `generateLocalBusinessSchema` — `@id: \`${siteUrl}/#organization\``
- T1.3: Rewrite `generateServiceSchema` — `provider: { '@id': \`${siteUrl}/#organization\` }` replaces inline LocalBusiness repetition
- T1.4: Add `generateBlogPostingSchema(post, business, siteUrl)` → `BlogPosting` @type
- T1.5: Add `parseHours(hoursString): OpeningHoursSpecification[] | undefined` — TS parser with unit tests; returns undefined on parse failure
- T1.6: Add `parseAddress(addressString): PostalAddressComponents | undefined` — TS parser with unit tests; returns undefined on parse failure
- T1.7: Wire `parseHours` / `parseAddress` into `generateLocalBusinessSchema`; omit sub-blocks on parser failure
- T1.8: If T0.1 returned "not recognized", update `@type` chain to `['LocalBusiness', 'HomeAndConstructionBusiness']`
- T1.9: Unit test coverage: all new generators + parsers + failure-mode omissions
- **NOT in v1:** ~~generateReviewSchema~~ — deferred with D5-D

### T2 — Next.js shell injection

- T2.1: Create `app/tenant/[slug]/_components/JsonLdScripts.tsx` server component with XSS-safe escape:
  ```ts
  export function JsonLdScript({ schema, id }: { schema: object; id: string }) {
    const safe = JSON.stringify(schema).replace(/</g, '\\u003c');
    return <script type="application/ld+json" id={id} dangerouslySetInnerHTML={{ __html: safe }} />;
  }
  ```
- T2.2: Layout-level injection (`layout.tsx`): LocalBusiness only (D2-A MODIFIED). Fetched via `unstable_cache` with tags for settings + service_areas.
- T2.3: Home `page.tsx`: WebSite schema (D2-A MODIFIED — WebSite on home only, not layout)
- T2.4: `[service]/page.tsx`: Service schema with `@id` provider reference
- T2.5: `about/page.tsx`: AboutPage schema
- T2.6: `faq/page.tsx`: FAQPage schema, conditional — omit when `faqs.length === 0`. Also omit if faqs aren't rendered visibly on page (Perplexity FAQ eligibility rule; T0.7 verifies)
- T2.7: `reviews/page.tsx`: **NO SCHEMA v1** (deferred with D5-D). Leave route untouched.
- T2.8: `blog/[post]/page.tsx`: BlogPosting schema
- T2.9: Other routes (`contact`, `quote`, `blog` index, `service-area`): LocalBusiness only, inherited from layout — no per-page additions v1

### T3 — Caching + admin hooks

- T3.1: ISR tag audit — every data source feeding JSON-LD (`settings.business_info`, `settings.seo`, `faqs`, `service_pages`, `blog_posts`) must have tag invalidation wired on admin save. Document in migration doc which tags exist and which are missing.
- T3.2: Add any missing revalidation tags identified by T3.1.
- T3.3: SEOHealthPanel surface: show "✅ JSON-LD emitted: LocalBusiness, WebSite (home), Service (per-service), AboutPage, FAQPage, BlogPosting" per tenant status.

### T4 — Rollback

- `docs/migrations/s165-9-seo2-rollback.md` — pure code revert (no DB changes v1 per D3-D/D4-D holding structured migration to seo2.5). Rollback = `git revert <range>` of T1–T3 commits. No CHECK constraints to drop.

### T5 — Verification gate

- T5.1: `curl -s https://cityshield.pestflowpro.com/ | grep -c 'application/ld+json'` — expect 1 LocalBusiness block
- T5.2: `curl -s https://cityshield.pestflowpro.com/about | grep -c 'application/ld+json'` — expect 2 (LocalBusiness + AboutPage)
- T5.3: `curl -s -A "GPTBot" https://cityshield.pestflowpro.com/` — verify JSON-LD present in response body (no JS executed). Same for `-A "ClaudeBot"` and `-A "PerplexityBot"`.
- T5.4: Google Rich Results Test pass on `/`, `/about`, `/faq` (once populated), `/[service]`
- T5.5: Drift gate: LocalBusiness.areaServed matches `settings.seo.service_areas` JSONB exactly
- T5.6: XSS safety check — insert `<script>alert(1)</script>` into `business_info.tagline` in a dev environment, verify output contains `\u003cscript\u003e`, not executable
- T5.7: Metro-pro regression baseline (standing rule)
- T5.8: Dang freeze check — `git diff main -- src/shells/dang/` shows zero changes

### T6 — ISR purge + deploy verify

- Single push at end, ISR purge empty commit, `list_deployments` READY confirm, final drift gate re-run

---

## 4. Out-of-scope items (logged, not addressed v1)

- **b15** — canonical source drift (`founded_year`, `owner_name`, `certifications` duplicated across `business_info` and `seo`). Add CHECK constraint enforcing single source. Own session.
- **b16** — Vite apex `StructuredData.tsx` vs `SEOHead.tsx` duplicate injector. Resolve alongside **seo3**.
- **seo2.5** — structured address + hours + geo columns in `settings.business_info`, admin form rewrite, migrate parser output into real columns. Hard-scheduled (Gemini): next SEO-focused session after seo2 ships.
- **seo3** — Vite apex marketing site (`pestflowpro.com`) JSON-LD upgrade. Pairs with b16.
- **Zernio Google Reviews ingest** → prerequisite for AggregateRating revisit. When reviews have verified Google provenance, D5 and D7 can revisit with real substrate.

---

## 5. Freeze-rule reaffirmation

- Zero edits under `src/shells/dang/**`
- Zero edits changing Dang's render path
- Dang's `DangFaqSchema.tsx` and inline service-page FAQPage blocks remain untouched
- If any T-step appears to touch Dang, stop and flag before proceeding (S160 carve-out precedent)

---

## 6. Session success criteria

1. `curl -s https://cityshield.pestflowpro.com/` returns initial HTML containing valid LocalBusiness JSON-LD with stable `@id` — no JS execution required
2. Google Rich Results Test passes LocalBusiness on home
3. Service page returns Service schema with `provider.@id` stitching to LocalBusiness
4. FAQ page returns FAQPage schema when FAQs exist, omits cleanly when they don't
5. `business_info.tagline` containing `<script>` emits escaped `\u003cscript\u003e` in JSON-LD — no breakout
6. `git diff main -- src/shells/dang/` returns empty
7. Drift gate: `settings.seo.service_areas` ⇔ rendered `LocalBusiness.areaServed` on all 5 shells

---

**End of v2-LOCKED.**
