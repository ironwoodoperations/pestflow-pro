# T2 faq_items hunt (s161.1)

## Summary

Total hits: 19 across 8 files.

Category A (dead comment):    0
Category B (active read):     3
Category C (active write):    0
Category D (seed / provision): 0
Category E (type / schema def): 1  (historical migration — leave alone)
Category F (docs / runbook):  15

No stop conditions triggered:
- No hits in src/shells/dang/ (Dang freeze rule clear)
- No hits in supabase/functions/ (no active write paths)
- No hits in .github/ (no CI scripts)
- Category D = 0 (no seed or provision references)

## Hits by file

### src/pages/FAQPage.tsx (Category B — active read)
- Line 51: `supabase.from('faq_items').select('id, question, answer, sort_order').eq('tenant_id', tid).order('sort_order')`
  - Part of a `Promise.all` in `useEffect`. The return value feeds `setFaqItems(itemsRes.data)`.
  - Render branch: `{faqItems.length > 0 ? <items list> : <FAQ_CATEGORIES fallback>}`
  - Interface `FaqItem` at line 37 is also tied to this read (Category E-adjacent, local type, not generated)
  - **Remove:** the `.from('faq_items')` call from the Promise.all, remove `itemsRes` binding, remove `setFaqItems` call, remove `faqItems` useState, remove `FaqItem` interface, delete the items render branch (keep the fallback branch as the sole render path)

### app/tenant/[slug]/_lib/queries.ts (Category B — active read)
- Line 140–154: `export const getFaqItems = cache(...)` — full Supabase query function
  - **Remove:** entire `getFaqItems` export

### app/tenant/[slug]/faq/page.tsx (Category B — active read)
- Line 10: `import { getPageContent, getFaqItems, getHeroMedia } from '../_lib/queries'`
- Line 48: `getFaqItems(tenant.id)` in `Promise.all`
- Line 74: `items.length > 0 ? <items list> : <FAQ_FALLBACK>`
  - **Remove:** `getFaqItems` from import, remove `items` from destructuring, remove items render branch (keep `FAQ_FALLBACK` as sole render path). Also remove `FaqItem`-typed usage.

### supabase/migrations/20260406_s61_faq_items.sql (Category E — historical migration)
- Lines 1–19: `CREATE TABLE faq_items`, `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, `CREATE POLICY` × 2
  - **Leave alone.** Historical migration; do not edit applied migrations.

### docs/s159-3a-inventory.md (Category F — docs)
- Lines 19, 112, 126, 141, 152, 157, 163, 168, 173, 177, 178, 182, 186, 187, 569, 604, 616
  - **Leave alone.** Reference/inventory document.

### docs/migrations/s160-3-t9-step3.md (Category F — docs)
- Line 99: reference to T2 faq_items as next session
  - **Leave alone.** Historical runbook entry.

### pestflow-pro-handoff-s149-pending.md (Category F — docs)
- Line 155: mention of faq_items as a possible write table
  - **Leave alone.** Historical handoff doc.

### pestflow-pro-handoff-s149-shipped.md (Category F — docs)
- Line 179: faqs vs faq_items mismatch note
  - **Leave alone.** Historical handoff doc.

### s134-modern-pro-crash-fix.txt (Category F — docs/runbook)
- Line 3: mention of faq_items in crash context list
  - **Leave alone.** Historical runbook.

## Removal plan for s161.2

Files to edit (3 total):
1. `src/pages/FAQPage.tsx` — remove faq_items query from Promise.all, remove faqItems state, remove FaqItem interface, delete items-render branch
2. `app/tenant/[slug]/_lib/queries.ts` — delete `getFaqItems` export (lines 140–154)
3. `app/tenant/[slug]/faq/page.tsx` — remove getFaqItems import + call + items render branch

No edge function changes. No seed file changes. No type regen needed (no generated types file).
