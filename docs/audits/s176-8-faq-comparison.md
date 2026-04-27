# S176.8 — FAQ Comparison

## Punchline
- PFP-side features beyond standalone: **search, category pills, accordion, AI chat FAB, JSON-LD schema**
- Question content drift: **SAME** — standalone hardcoded array is the original source PFP's DB was seeded from; same 55 questions, same phrasing
- Port complexity: **MODERATE**
- Session 1 impact: **0.5 sessions**

---

## PFP-side FAQ
- Component file: `src/shells/dang/pages/FAQPage.tsx:22`
- Data source: `faqs` table in PFP Supabase (`biezzykcgzkrwdgqpsar`), queried by `tenant_id`
- Question count: **55** (confirmed via DB — 10 categories)

| Category | Count |
|---|---|
| General | 18 |
| Ants | 4 |
| Spiders | 4 |
| Wasps & Yellow Jackets | 5 |
| Scorpions | 4 |
| Rodents | 4 |
| Mosquitoes | 4 |
| Fleas & Ticks | 4 |
| Roaches | 4 |
| Bed Bugs | 4 |
| **Total** | **55** |

- Features:
  - **Sticky search bar** — filters simultaneously on question text AND answer text; shows "N of 55 questions" result count; clear-X button (`FAQPage.tsx:124-149`)
  - **Category pills** — sticky nav bar with 10 category buttons; IntersectionObserver-based active tracking highlights pill as user scrolls into each section (`FAQPage.tsx:44-83`)
  - **Smooth scroll** — clicking a category pill scrolls to that section with sticky-nav offset compensation
  - **Accordion expand/collapse** — each FAQ item is an independent accordion via `DangFaqAccordion.tsx`; animated +/− toggle with orange circle indicator (`DangFaqAccordion.tsx:15-40`)
  - **AI chat FAB** — fixed "🤖 Ask Dang AI" button (bottom-right); lazy-loads `DangFaqAiChat.tsx` on click
  - **DB-driven** — questions editable by Kirk through the PFP admin FaqTab without a redeploy
- JSON-LD FAQPage schema: **yes** — `DangFaqSchema.tsx` fetches top 10 FAQs and injects `FAQPage` JSON-LD into `<head>` via `StructuredData`; however it is **mounted in `ShellHomeSections.tsx:17`** (site-wide on every page), NOT inside the FAQ page component itself

---

## Standalone-side FAQ
- Component file: `src/pages/FAQPage.tsx:62`
- Data source: **hardcoded array** of 55 items defined at `src/pages/FAQPage.tsx:4–59`
- Question count: **55**
- Features:
  - **Flat numbered list only** — renders questions as `<h2>N. question</h2>` + `<p>answer</p>` with 28px margin between items (`FAQPage.tsx:100-107`)
  - No search
  - No categories
  - No accordion (all answers always visible)
  - No AI chat
  - Questions not editable without a redeploy
- JSON-LD FAQPage schema: **no** — page does not import `SEO` component, emits no `application/ld+json`

---

## Feature delta (PFP − standalone)

- ✓ Search input (filters Q + A text) in PFP, ✗ in standalone
- ✓ Category pills with IntersectionObserver active state in PFP, ✗ in standalone
- ✓ Accordion expand/collapse in PFP, ✗ in standalone
- ✓ AI chat FAB ("Ask Dang AI") in PFP, ✗ in standalone
- ✓ JSON-LD FAQPage schema in PFP, ✗ in standalone
- ✓ DB-driven (admin-editable without redeploy) in PFP, ✗ in standalone (hardcoded)

---

## Question content delta
- Both sets have **55 questions**
- Overlap: **full** — standalone hardcoded array is the source; PFP DB was seeded from it verbatim
- Notable answer drift: **none observed** — spot-checked "Are fire ants dangerous in Tyler yards?", "Why are mosquitoes so aggressive in East Texas?", and "How long does it take for the insecticide to work?" — text matches between standalone array and PFP DB content

---

## Port plan (if Path D proceeds)

- **Bring over to standalone:**
  1. `DangFaqAccordion.tsx` — self-contained, zero dependencies beyond React; drop-in copy
  2. Search input + filtering logic — ~40 lines from `FAQPage.tsx:26-73`; state stays in `useState`
  3. Category pills + IntersectionObserver — ~40 lines from `FAQPage.tsx:44-83`; works with existing DOM structure
  4. JSON-LD FAQPage schema — either port `DangFaqSchema.tsx` + `generateFAQSchema` or inline the schema generation; add to FAQ page component (not site-wide as in PFP)
  5. `DangFaqAiChat.tsx` — the most complex piece; calls Anthropic API; requires `VITE_ANTHROPIC_KEY` env var in standalone's Vercel project

- **Reuse from standalone:**
  - Hero section markup — already pixel-identical to PFP shell (`FAQPage.tsx:69-96` vs `shells/dang/pages/FAQPage.tsx:91-112`; only difference is image path `/moblie_banner.webp` vs `/dang/moblie_banner.webp`)
  - Overall page shell + Navbar/Footer wiring — unchanged

- **Data migration:**
  - Verify that standalone Supabase (`bqavwwqebcsshsdrvczz`) has a `faqs` table — the standalone's `src/integrations/supabase/types.ts` does NOT list a `faqs` table, which means the table does not currently exist in the standalone DB
  - If porting, two options: (a) create `faqs` table in standalone Supabase and seed it from the existing 55-item hardcoded array, OR (b) keep the hardcoded array and skip the DB-driven path; switch to DB-driven only if Kirk needs to self-edit FAQs
  - Simpler path for Path D: keep hardcoded array, add search/accordion/categories purely client-side, add JSON-LD inline — avoids a Supabase migration entirely

---

## Estimated Session 1 impact
- **~2–3 hours of a session (0.5 sessions)**
- Justification: `DangFaqAccordion` + search + category pills is ~80 lines of self-contained React that ports directly; the main variable is whether to wire the `DangFaqAiChat` (AI chat requires Anthropic env var setup in standalone Vercel, adding ~30 min); JSON-LD addition is 10 lines; no DB changes needed if keeping hardcoded data
