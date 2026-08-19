# PestFlow Pro — Handoff S-PLS-1 (Precision Lawn Systems)

**Date:** 2026-08-19
**Orchestrator:** Claude.ai (MCP) · **Builder:** CC Web, branch `claude/precision-lawn-systems-reskin-lg8goz`
**Tenant:** Precision Lawn Systems LLC · slug `pls` · id `840b6ad1-590f-491e-a9ef-0b439d6846c1`
**Live:** https://pls.pestflowpro.ai (noindexed, pre-launch)

Durable rules live in `CLAUDE.md` / `00-master/PRINCIPLES.md`. Spec lives in
`docs/tenants/precision-lawn-systems/BUILD-SPEC-v2.md`, amendments in
`DECISIONS.md` beside it. **Read DECISIONS.md before the spec** — where they
conflict, DECISIONS.md is current.

---

## 1. Where this stands

Phase One is roughly half built. The tenant is provisioned and rendering at the
correct palette with irrigation copy on the homepage and the four service pages.
The remaining work is stripping pest vocabulary out of the shared modern-pro
shell — which turned out to be most of the homepage body, not a polish pass.

**Merged this session:**

| PR | What |
|---|---|
| #244 | Spec + design reference committed to `docs/tenants/precision-lawn-systems/` |
| #245 | `seoSchema.ts` — `SchemaVocabulary` param on `knowsAbout` / `serviceType`, pest defaults, byte-identical for existing callers |
| #246 | `PALETTE_HERO['#0e3b44']` in both twin files + `Object.freeze` hardening on the vocabulary default + `DECISIONS.md` |
| #247 | Provisioning record (`seed/provision.sql`) + decision rows. DB writes applied via MCP. |
| #248 | Per-tenant `settings.seo.noindex` gate + four `page_content` service rows + `seo.meta_title` |
| #249 | D1 plumbing — `irrigationContent.ts`, `IRRIGATION_SERVICE_SLUGS`, `getServiceEntry`, vertical resolution in `[service]/page.tsx` |

**Open:** #250 — decouple `resolveVertical` from the `business_info.industry`
prose string via an explicit `settings.business_info.vertical` key (substring
fallback retained). Clean, awaiting merge.

---

## 2. Architecture decisions (settled — do not relitigate)

- **D1 catalog placement:** parallel `irrigationContent.ts` reusing the
  `PestEntry` interface, plus `IRRIGATION_SERVICE_SLUGS` as a union-by-vertical
  selection. `SERVICE_DATA` / `PEST_CONTENT_MAP` never mutated. There are **two**
  static maps — `src/shells/_shared/pestContent.ts` (copy) and
  `app/tenant/[slug]/_lib/serviceData.ts` (`SERVICE_SLUGS`, the router).
- **D2 first non-pest vertical:** no. Vita Glow precedes it (dedicated shell +
  early `tenant.template` branch). `tenants.render_model` is `standard` /
  `standalone` — a rendering-path flag, **not** a vertical flag.
- **D3 service × location pages:** dropped. `location_data` is a VIEW over
  `service_areas`; same cap trigger. No `[service]/[location]` route exists.
- **D4 theme:** `modern-pro` + hand-authored `PALETTE_HERO['#0e3b44']`, not
  `mp-2` and not `clean-friendly` (which is a fixed-token shell — `cf-2` is
  inert there). `cta: '#092A31'`, not clay — `--color-bg-cta` backs five shared
  surfaces where clay fails contrast.
- **Slug:** `pls`. §0.1 bars "lawn" from anything public; a slug is public.
- **D1 seam is partial:** only `ModernProPestPage` uses `getServiceEntry`. The
  other five shell pest pages still read `PEST_CONTENT_MAP` directly.

---

## 3. The live problem — fabricated content, platform-wide

Found by fetching rendered output, not by reading components. **Two source
reads missed it.** Any inventory of remaining work must be built from fetched
HTML.

`app/tenant/[slug]/reviews/page.tsx`:

- `PLACEHOLDER_REVIEWS` — six invented reviews attributed to Google, Facebook,
  and Yelp. Fires whenever `testimonials` is empty. **7 of 9 tenants have zero
  rows.**
- The stats strip — `4.9 ★ Google Rating / 200+ Reviews / #1 Most Trusted` —
  renders **unconditionally**, including on `pestflow-pro` (the demo, 8 real
  rows). Only Dang escapes, because it's standalone.

Also live on the Precision homepage: three hardcoded testimonials
(`ModernProTestimonials`), a 12-tile pest services grid from `MODERN_PRO_SERVICES`
in `page.tsx`, "Lawn" in two H2s, and pest copy in TrustBar / WhyChooseUs /
CtaBanner. `/faq` and `/about` fallbacks assert pest licensure and EPA
certification the client does not hold.

Spec §9 forbids a fabricated `AggregateRating` in JSON-LD. It has been rendering
as visible body text on every tenant instead.

---

## 4. PR 5, as scoped and approved

**5a — kill the fabrications. First, ahead of the data pass.**
Gate/remove `PLACEHOLDER_REVIEWS` and the stats strip; `ModernProTestimonials`
renders DB rows or hides. Blast radius across all tenants **approved** — this is
a defect fix, not a feature change. Acceptance is inverted from usual: prove the
fabrications are gone everywhere, and that `pestflow-pro` (8 real rows) still
renders those rows unchanged.

**Data pass (DB-only, same day).** Seed irrigation `faqs` rows and the
`page_content` 'about' row. **Testimonials are blocked** — see §6.

**5b — vertical-keyed vocabulary.** The large one: homepage grid source and
headings, TrustBar / WhyChooseUs / CtaBanner / Hero / AboutStrip, location-branch
and shared `Process`, footer first-service link, `ModernProPestPage` STEPS and
fallbacks, blog / faq / quote strings, JSON-LD vocabulary wiring. Acceptance:
apex-protect rendered-HTML before/after diff, byte-identical.

**5c — hex→CSS vars + canonical.** `ModernProPestPage` *and*
`ModernProContactPage` both carry the hardcoded `#0B1220`/`#3FB8AF` block. Plus
per-path canonicals — every route without its own `generateMetadata` currently
emits the root URL as canonical (all tenants; moot under noindex, wrong at
launch).

Then sticky call bar + estimate-form placement.

---

## 5. Verification discipline that earned its keep

- **Read the branch, not the report.** Every PR this session was verified via
  `pull_request_read get_diff` or `get_file_contents` on the branch ref before
  merge. Nothing was wrong, but the checks were cheap.
- **Fetch the rendered page.** Source reads missed the fabricated reviews twice.
- **Query the live DB.** Row counts, not summaries.
- **`gh pr merge --auto`** when checks are pending. Never `--admin` on shared code.
- CC self-corrected two of the orchestrator's premises this session (the nav
  links 404 rather than rendering pest content; the spec on main carries no
  blockquote overrides). Both corrections were right.

---

## 6. Blocked on the client — the real critical path

None of this is a PR. It has not moved all session.

| § | Item | Blocks |
|---|---|---|
| 6.1 | PO Box 859 vs 700 Francis St | GBP verification **and** address JSON-LD (the `business_info_structured_shape` CHECK is all-or-nothing, so locality/region/postal wait too) |
| 6.2 | TCEQ verification of LI23001 | A trust claim already rendering site-wide |
| 6.3 | **No Google Business Profile exists** | Highest-value item in the engagement. Off-site work. |
| 6.4 | Email off `@yahoo.com` | `notifications.lead_email` unset → §14 "notifications firing" cannot pass |
| 10 | **Larry Kellam + Jay D. Wilson testimonial text, verbatim** | The data pass. Nancy Bentley Bowen's is in `design-reference/home.html`. Never paraphrase — excerpt or omit (§0.2). Seed with `source` NULL or "Website", never "Google". |
| 15.3 | Equipment / controller brands | Nothing may be invented |
| 15.4 | Business hours | Config value unset |
| 15.6 | Deferred towns he won't drive to | The render shows Alba and Golden (absent from the spec) and omits Lake Holbrook (in the spec). 24 entries seeded as-is pending his confirmation. |
| 15.7 | Photo library handoff | `/projects` deferred to Phase Two; `/photo-gallery/` → `/` until it exists |

---

## 7. Logged, not fixed

- `areaServed` types every `seo.service_areas` entry as `{'@type':'City'}` —
  "Smith County" is mistyped, wants `AdministrativeArea`. Own scoped PR.
- `supabase/.temp/cli-latest` and `docs/handoffs/s211a-handoff.md` show as
  persistently modified. The former probably wants gitignoring.
- Claude.ai's GitHub MCP token is **read-only** on this repo — branch creation
  returns 403. Worth restoring branch-write scope.

---

## 8. Next actions, in order

1. Merge #250.
2. CC ships 5a. Verify by fetching `/reviews` on `pls` and on `pestflow-pro`.
3. CC runs the data pass minus testimonials.
4. Scott pulls the two verbatim testimonials off the client's current site.
5. 5b, then 5c.
6. Scott works §6.1–6.4. §6.3 is worth more than the rest of Phase One combined.
