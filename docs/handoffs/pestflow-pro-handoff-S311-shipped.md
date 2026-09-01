# PestFlow Pro — Session Handoff S311 (SHIPPED)

**Date:** 2026-09-01
**PR:** #313 — merged, squash `d879f3c`
**Branch:** `fix/s311-pls-homepage-review-selection-logo-height` (branched from `main` @ `bf2d5b6`)
**Scope:** pls homepage — deterministic review selection, per-tenant nav logo height, one fabricated preset fact removed.
**Gate:** none. No auth, no RLS, no caching, no metadata APIs, no edge functions.

---

## What shipped

### Part A — the homepage picked three reviews with no defined order

`ModernProTestimonials` did `testimonials.slice(0, 3)` over a list `getTestimonials()` orders by
`created_at DESC` alone, and **never read `featured`**. `created_at DESC` is not a total order:
pls's 50 `google_outscraper` rows all share `created_at 2026-08-24 13:33:38.974306+00` — a single
bulk insert — so the head of the list was a 50-way tie with no defined resolution.

**The defect was demonstrated in production, not argued from a fixture.** Production was serving
G Bearden, Hal S and Jake Connor. This session's own query against the same data returned Grant
Smith and Sue Tumbleson — both **blank cards**. Same code, same rows, different output. The two
observations disagreeing *is* the bug.

Selection now: drop rows whose `review_text` has no non-whitespace content → `featured === true`
first → rating DESC → text length DESC → **`id` ASC**. Comparing `id` last makes the order
**total**; nothing can tie, so the result cannot depend on input order, sort stability, or what
Postgres returned that run.

Two decisions worth carrying:

- **The `length === 0` early exit moved from the raw input to the selected set.** Left on the
  input, a tenant whose every row is blank renders the TESTIMONIALS heading above an empty grid.
  Empty input still exits, since selecting from `[]` yields `[]`.
- **Only the literal boolean `true` counts as featured**, matching the `noindex` treatment of
  untrusted JSONB.

`getTestimonials()` was left **unchanged on purpose** — four other shells consume it.

### Part B — per-tenant nav logo height

`ModernProNavbar` hardcoded `height: '40px'`, shared by every modern-pro tenant **and** every
tenant whose theme is unrecognized (modern-pro is `layout.tsx`'s default branch).

Added optional `settings.branding.logo_height_px`, resolved in `resolveSettings()` **alongside
`logo_url`** — the only path `useTenant()` exposes. A field read anywhere else would be
`undefined` at render with nothing visibly broken, which is the trap the brief flagged and it is
real. `normalizeLogoHeightPx()` lives in `shared/lib/tenant/types.ts` (zero imports, so the client
component can import it safely), runs at both resolve time and render time, and is idempotent so
the two always agree. Non-numeric → 40; numbers and numeric strings → rounded, clamped 16–64
(64 because the nav row is Tailwind `h-16`). **No tenant value was written.**

### Part C — a tenant fact removed from a vertical preset

Deleted `{ label: '4.9 on Google', sublabel: '49 reviews' }` from `MODERN_PRO_VERTICAL.irrigation`.
Preset rule (a): a preset holds only what is true of the whole **trade**. Deriving the numbers
needed **no new query** — `page.tsx` already holds every row at line 154 — and was still rejected,
because a count of locally-synced rows is not the count on the Google listing, so a derived figure
is a differently-wrong claim about a third party.

### Tests

21 new in `modernProTestimonialSelection.test.tsx`, including:
- shuffle-invariance over the 50-identical-timestamp case across 25 deterministic shuffles;
- a **self-guard** asserting the old `slice(0,3)` *does* differ under the same shuffle — if it ever
  passes, the fixture stopped exercising the tie and the suite has gone vacuous (the S290
  non-trivial-corpus lesson, applied);
- a byte-identical baseline **captured by rendering the component as it stood on `main`**.

---

## Verified live state

- **pls is the only live surface this PR changes**, and it is `seo.noindex: true` — pre-launch.
  It now renders Nancy Bentley Bowen, Larry Kellam and Jay D. Wilson every rebuild.
- **`apex-protect`** has zero testimonial rows → the section returns `null`. No change.
- **`dang` is not served by this repo at all** — see the boundary note below.
- Only **three** tenants resolve to modern-pro (`apex-protect`, `dang`, `pls`).
  `metro-pest-concierge`, `pestflow-pro` and `vita-glow` take other `layout.tsx` branches.
- pls testimonial rows: **50** `google_outscraper` (1 distinct `created_at`, **10 with empty
  `review_text`**, 0 featured) + **4** `client_site` (3 featured). 54 total.
- CI green on `f6241ba`: `ci`, `Validate`, `Auth isolation (Deno + local Supabase)`, Vercel.
  Locally: `tsc --noEmit` clean, eslint 0 errors / 178 warnings, **1182 tests / 43 files**, build OK.

---

## Corrections made this session

**Three in the brief**, all caught by checking live data before writing code:

| brief said | live truth |
|---|---|
| 51 `google_outscraper` rows | **50** |
| 3 with empty `review_text` | **10** |
| "the other five modern-pro tenants" | **two**, neither affected |

**One was mine, and it is the important one.** The first PR body stated — as verified — that
dang's homepage would change, with a before/after table. That was derived from SQL ordering over
dang's rows **without checking whether this repo serves dang's public site.** It does not. Scott
caught it. The table was wrong, not the code.

**One structural problem with the brief:** the requested byte-identity assertion ("byte-identical
output for a tenant with zero featured rows and distinct `created_at`") is **not a property the
specified algorithm has**. `featured`-first and rating/length/id reorder *every* list, not only
tied ones — the new comparator never reads `created_at`. It holds only when rows already happen to
be in canonical order. The spec was implemented **as written** rather than quietly adding
`created_at` to the comparator to make the assertion pass, and the real behaviour was pinned in a
test that asserts a zero-featured, non-canonical tenant *is* reordered by design.

---

## THE REPO BOUNDARY — read this before reasoning about any dang render path

**dang's public site is NOT served by this repository.**

- `dang.pestflowpro.ai` → **404**. There is no public tenant homepage for dang here.
- Kirk's live site is **`dangpestcontrol.com`**, served from a **separate standalone repo**.
- `tenants.custom_domain` for dang is `admin.dangpestcontrol.com` — the **admin** host.
- Therefore `ModernProTestimonials`, and every other `app/tenant/[slug]/` shell, **never renders
  for dang.**

**This cost two wrong conclusions in one session.** It is easy to get wrong because dang's
`testimonials`, `page_content` and `settings` rows are all real and reachable from this repo's
admin — the *data* is here, the *public render* is not. Do not infer a dang render path from the
presence of dang rows.

---

## Open / pending (carried to next)

1. **`getTestimonials()` still has no total order; four shells still consume it.** BoldLocal and
   CleanFriendly sort `featured` with a **non-total** comparator and no empty-text filter;
   RusticRugged takes `[0]`; DangComic and the default `Reviews` do nothing. Not urgent — the
   tenants on those shells have zero rows — but live the moment one syncs reviews. Fix is one PR
   that gives the query a total order and updates all five shells together.
2. **`RusticRuggedTestimonials.tsx:5` holds a hardcoded invented testimonial** used when passed
   null. A fabricated customer quote in shipped code; same class as the S280/S286 sweep, which
   did not reach shell fallbacks.
3. **`'Licensed since 2017'` and `'Free 2-year warranty'` remain in the irrigation preset** — both
   tenant facts under the same rule that removed the Google rating. Out of S311's scope.
4. **Set pls `logo_height_px` to 32** from Claude.ai once Vercel reports READY on main. S311
   shipped the field and wrote no value; absent = 40px = unchanged.
5. **dang's six suspicious `testimonials` rows — DECISION PENDING, untouched.** `source='Google'`,
   `google_review_id` **NULL**, initials-only names, all six at clock time `15:01:36.775` with
   ~20-day spacing, against 49 `google_outscraper` rows that all carry a real ID. Seed data in a
   paying client's dashboard. Not published anywhere today. Scott decides.
6. **`tenants.custom_domain` for dang (`admin.dangpestcontrol.com`) does not resolve — NXDOMAIN.**
   Decide whether that field should hold an admin host at all.
7. **S300 guard reached state 3 of 3 and is CLOSED** (by S310, confirmed while writing this):
   `IRRIGATION_CONTENT_MAP` holds `artificial-turf`, five entries total, `retaining-walls` still
   out per S302. The ROADMAP line claiming state 2 of 3 was stale and is corrected in the same
   update as this handoff.
8. **PR #312 (S309 gate) is untouched and still blocked** on the Perplexity + Gemini verdicts.
   S311 branched from `main` specifically to avoid coupling to it.

---

## Standing order amended this session

> Develop on the designated branch **UNLESS** that branch carries an open PR that is blocked on
> something external, or whose scope the new work would break. In that case, branch from `main`
> and say so in the PR body. Do not ask again for this case — ask when it is a judgement call the
> rule does not resolve.

Applied here: the designated branch carries #312, a docs-only gate submission blocked on external
verdicts. Coupling S311 to it would have blocked an unrelated fix behind a review round-trip it
does not need, and destroyed what makes #312 cheap to review — one markdown file, zero code.
