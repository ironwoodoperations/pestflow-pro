# S166-T0 — YouPest Blast Radius Audit

Generated: 2026-04-22

---

## T0.1 — Youpest References Repo-Wide

### Shell (to be deleted)
- `src/shells/youpest/ShellNavbar.tsx`
- `src/shells/youpest/ShellFooter.tsx`
- `src/shells/youpest/ShellHero.tsx`
- `src/shells/youpest/ShellHomeSections.tsx`
- `src/shells/youpest/SectionRenderer.tsx`
- `src/shells/youpest/ServicesData.ts`
- `src/shells/youpest/sections/AboutStripSection.tsx`
- `src/shells/youpest/sections/CtaBannerSection.tsx`
- `src/shells/youpest/sections/HeroSection.tsx`
- `src/shells/youpest/sections/ServicesGridSection.tsx`
- `src/shells/youpest/sections/TrustBarSection.tsx`
- `src/shells/youpest/sections/WhyChooseUsSection.tsx`

### Public routing (must be cleaned)
- `src/components/PublicShell.tsx` lines 23-25, 212, 229, 242 — lazy imports + 3 switch cases for `case 'youpest'`

### Ironwood CRM components (must be cleaned or deleted)
- `src/components/ironwood/GenerateProLayout.tsx` — entire file is youpest-specific (calls `generate-youpest` edge fn, reads/writes `youpest_layout` on prospects). Only used by `ScrapePanel.tsx:181`. **Delete this file.**
- `src/components/ironwood/ProLayoutSummary.tsx` — used only by `GenerateProLayout.tsx`. **Delete this file.**
- `src/components/ironwood/ApplyProSiteButton.tsx` — used only by `GenerateProLayout.tsx`. **Delete this file.**
- `src/components/ironwood/ScrapePanel.tsx` line 6, 181 — imports and renders `GenerateProLayout`. Remove those 2 references.
- `src/components/ironwood/SiteRecreationCard.tsx` line 17 — `{ id: 'youpest', name: 'YouPest' }` in the `THEMES` array. Remove this entry.
- `src/components/ironwood/ProspectDetail.Branding.tsx` line 10 — `{ id: 'youpest', name: 'YouPest (Pro/Elite)', proOnly: true }` in `ALL_THEMES`. Remove this entry.
- `src/components/ironwood/types.ts` line 69 — `youpest_layout: Record<string, any> | null`. Remove this field.

### Admin client-setup component
- `src/components/admin/client-setup/components/ShellSelector.tsx` lines 40-47 — youpest entry in THEMES array (`key: 'youpest'`, name, desc, swatches, proOnly). Remove this entry + the `tier` comment on line 4.

### Edge function (to be deleted)
- `supabase/functions/generate-youpest/index.ts` — entire file. **Delete.**

### Provision-tenant edge function (must be cleaned)
- `supabase/functions/provision-tenant/index.ts` lines 350-373 — "Step 6: Seed youpest_layout" block. This block reads `prospects.youpest_layout`, writes to the `youpest_layout` table. Remove the entire block (non-fatal path, won't break provisioning).

---

## T0.2 — generate-youpest Edge Function Callers

Single call site:

```
src/components/ironwood/GenerateProLayout.tsx:40
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-youpest`, {
```

This entire file is youpest-specific and will be deleted in T3.

---

## T0.3 — youpest_layout Column Readers

| File | Lines | Action |
|------|-------|--------|
| `src/components/ironwood/types.ts` | 69 | Remove field from Prospect type |
| `src/components/ironwood/GenerateProLayout.tsx` | 27, 76, 181 | Delete entire file |
| `src/shells/youpest/ShellHomeSections.tsx` | 21 | Delete entire file (shell deletion) |
| `src/shells/youpest/ShellNavbar.tsx` | 32 | Delete entire file |
| `src/shells/youpest/ShellFooter.tsx` | 28 | Delete entire file |
| `supabase/functions/provision-tenant/index.ts` | 350-373 | Remove youpest seeding block |
| `supabase/functions/generate-youpest/index.ts` | 195, 198, 202 | Delete entire file |

No migration file *created* the column was found in `docs/` or `supabase/` — the column is live in the `prospects` table as a JSONB field. DDL drop runs post-Vercel READY (T4.5).

---

## T0.4 — Intake Form: Youpest / Scrape Tier Option

**Finding:** Youpest is NOT presented as a pricing-tier option in the intake form (`src/pages/intake/`). The intake form references scraping only in a UX description bullet (line 71 of `IntakeStep2Branding.tsx` — explains the process in a list item, not a selectable tier).

**Youpest appears as a selectable option in two Ironwood CRM components:**

### Location 1: `src/components/admin/client-setup/components/ShellSelector.tsx` (lines 40-47)
This is the **client-facing** shell picker used in the client's admin setup flow. Youpest entry:
```tsx
{
  key: 'youpest',
  name: 'YouPest AI Quick Build',
  desc: 'AI-generated layout from scraped site. Same-day launch.',
  swatches: ['#6366f1', '#818cf8', '#312e81'],
  proOnly: true,
},
```
Filtered to show only when `tier >= 3`. Removing this entry removes the option from the admin client-setup UI.

### Location 2: `src/components/ironwood/ProspectDetail.Branding.tsx` (line 10)
Scott-facing prospect branding panel. Youpest entry:
```tsx
{ id: 'youpest', name: 'YouPest (Pro/Elite)', proOnly: true },
```
Shows in the theme dropdown when creating/editing a prospect with Pro or Elite tier.

### Location 3: `src/components/ironwood/SiteRecreationCard.tsx` (line 17)
Claude-generated site recreation analysis card. Youpest entry:
```tsx
{ id: 'youpest', name: 'YouPest' },
```
This card is used in the ScrapePanel to let Claude recommend a shell. Remove youpest option.

**Scott, please confirm:** removing youpest from all three dropdowns above is what you want. After deletion, the available themes for Pro/Elite prospects will be: metro-pro, modern-pro, bold-local, clean-friendly, rustic-rugged. No youpest option anywhere.

---

## T0.5 — ESLint Config

**Format:** Flat config (`eslint.config.js`) — NOT legacy `.eslintrc`.

**Current ignores:** Only `dist` via `globalIgnores(['dist'])`.

**No `.eslintignore` file exists.** Ignores must go in `eslint.config.js` under `globalIgnores(...)`.

**`react-hooks/set-state-in-effect` rule location:** Already present as an explicit rule:
```js
rules: {
  'react-hooks/set-state-in-effect': 'warn',   // already warn!
```

**IMPORTANT:** The rule is already set to `'warn'`, not `'error'`. So T1.2 (downgrade to warn) is already done. The 629 errors are NOT coming from this rule — they're almost entirely from `supabase/functions/**` running through browser TypeScript ESLint rules (Deno code being linted as browser code).

The T1 fix needed: add `supabase/functions/**` to `globalIgnores` in `eslint.config.js`.

---

## T0.6 — Current Lint Baseline

```
✖ 698 problems (629 errors, 69 warnings)
  0 errors and 5 warnings potentially fixable with the --fix option.
```

---

## Ready for T1

**Blast radius summary:**

The youpest deletion touches **10 files** outside of the shell and edge function directories:

1. `src/components/PublicShell.tsx` — remove 3 lazy imports + 3 switch cases
2. `src/components/ironwood/ScrapePanel.tsx` — remove 1 import + 1 render of GenerateProLayout
3. `src/components/ironwood/SiteRecreationCard.tsx` — remove 1 theme entry
4. `src/components/ironwood/ProspectDetail.Branding.tsx` — remove 1 theme entry
5. `src/components/ironwood/types.ts` — remove `youpest_layout` field
6. `src/components/admin/client-setup/components/ShellSelector.tsx` — remove 1 theme entry
7. `supabase/functions/provision-tenant/index.ts` — remove lines 350-373 (youpest seeding)
8. **Delete:** `src/components/ironwood/GenerateProLayout.tsx`
9. **Delete:** `src/components/ironwood/ProLayoutSummary.tsx`
10. **Delete:** `src/components/ironwood/ApplyProSiteButton.tsx`
11. **Delete tree:** `src/shells/youpest/`
12. **Delete tree:** `supabase/functions/generate-youpest/`

**ESLint fix (T1):** Only one change needed — add `supabase/functions/**` to `globalIgnores` in `eslint.config.js`. The `set-state-in-effect` rule is already at `'warn'` — no change needed there.

**Expected lint improvement:** 629 errors → ~50 errors after adding the globalIgnores for edge functions.
