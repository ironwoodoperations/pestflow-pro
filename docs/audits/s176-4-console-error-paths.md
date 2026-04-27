# S176.4 — Console Error Code Paths

## Error 1 — icons/icon-192.png 404

- Manifest: `public/manifest.json:12` (also `public/_admin/manifest.json:12`)
- Referenced path: `/icons/icon-192.png` and `/icons/icon-512.png`
- File on disk: **exists but corrupt** — both files are 69-byte stubs, not valid PNG images
  (`ls -la public/icons/` → `icon-192.png 69 bytes`, `icon-512.png 69 bytes`)
- The browser requests them, receives an unrecognizable response, and reports 404
- Proposed 1-line fix: replace `public/icons/icon-192.png` and `public/icons/icon-512.png`
  with real 192×192 and 512×512 PNG exports of the PestFlow Pro / Dang logo

---

## Error 2 — why-bg.webp 404

- Reference: `src/shells/dang/WhyChooseUs.tsx:35`
- Code: `backgroundImage: \`radial-gradient(...), url('/why-bg.webp')\``
- File on disk: **missing** — `public/` contains `why-custom.webp`, `why-family.webp`,
  `why-professional.webp`, `why-referral.webp`, `why-superpowered.webp` but NOT `why-bg.webp`
- Proposed 1-line fix: in `WhyChooseUs.tsx:35` change `'/why-bg.webp'` to
  `'/why-superpowered.webp'` (closest existing asset) OR add the missing file to `public/`

---

## Error 3 — settings ?key=eq.holiday_mode 404

- Hook: `src/shells/dang/hooks/useHolidayMode.ts:43–46`
- Current call: queries **`site_config`** table (does not exist — `information_schema` returns
  0 rows for `site_config`), with no `tenant_id` filter, using `.single()`
- Correct component: `src/components/HolidayBanner.tsx:14` queries **`settings`** table with
  `.eq('tenant_id', tenantId).eq('key', 'holiday_mode').maybeSingle()` — this is the right pattern
- DB check: `site_config` table confirmed absent from `public` schema
- Three problems in one hook: wrong table (`site_config` vs `settings`), missing tenant scope,
  wrong method (`.single()` vs `.maybeSingle()`)
- Proposed fix: delete `useHolidayMode.ts` and update the Dang shell components that import it
  to use `HolidayBanner.tsx` directly (it already has correct logic). The Dang shell currently
  imports `useHolidayMode` in its navbar/banner layer for the same purpose `HolidayBanner` serves.
- Caveat: any Dang component that reads `activeTheme` from `useHolidayMode` needs to be
  rewired to read from the `settings.holiday_mode` shape instead

---

## Error 4 — empty page_slug 400

- Hook: `src/hooks/usePageContent.ts:9`
- Signature: `usePageContent(tenantId: string | null, pageSlug: string = '')`
- Root cause: **all Dang shell callers pass only one argument** — the page slug string — which
  lands in the `tenantId` parameter, leaving `pageSlug` at its default empty string `''`
  - Example: `src/shells/dang/pages/AntControl.tsx:11` calls `usePageContent('ant-control')`
  - Example: `src/shells/dang/HeroSection.tsx:35` calls `usePageContent('home')`
  - This produces: `GET page_content?tenant_id=eq.ant-control&page_slug=eq.` → 400
- Guard at `usePageContent.ts:17` checks `!cacheKey || !tenantId` but does NOT check `!pageSlug`.
  Since `cacheKey = 'ant-control:'` is truthy, the guard passes and the broken query fires.
- Proposed 1-line fix (stops the error): add `|| !pageSlug` to the guard at `usePageContent.ts:17`:
  `if (!cacheKey || !tenantId || !pageSlug) return;`
- Deeper fix needed: Dang callers should be updated to pass `(tenantId, 'page-slug')` — but
  that requires `resolveTenantId()` integration across ~12 Dang page components. The 1-line
  guard stops the 400s and is safe since the hook returns `{ content: null, loading: false }`
  when guarded (Dang components already handle null content via fallbacks)

---

## Error 5 — ?order=sort_order.asc 400

- Query origin: `src/shells/dang/TestimonialsSection.tsx:43`
- Code: `.order("sort_order", { ascending: true })` on the `testimonials` table
- `sort_order` exists on: `faqs`, `faq_items_backup_t2` (DB confirmed)
- `sort_order` exists on `testimonials`: **NO** — column absent from schema
- Result: PostgREST returns 400 "column testimonials.sort_order does not exist"
- Component has hardcoded fallback testimonials (`fallback` array at lines 13–18) so it
  renders correctly despite the error — this is a silent failure with visible console noise
- Proposed 1-line fix: in `TestimonialsSection.tsx:43`, change
  `.order("sort_order", { ascending: true })` to `.order("created_at", { ascending: false })`

---

## Tables with sort_order (DB scan)

Tables in `public` schema with a `sort_order` column:
- `faqs`
- `faq_items_backup_t2`

Tables referenced in source that use `.order('sort_order')` but **lack the column**:
- `testimonials` (`TestimonialsSection.tsx:43`)

Note: `src/shells/dang/components/DangFaqSchema.tsx:21` and
`src/shells/dang/pages/FAQPage.tsx:40` also use `.order('sort_order')` on the `faqs`
table — those are correct since `faqs` has the column.

---

## Summary

| # | Error | Source file:line | Fix complexity |
|---|---|---|---|
| 1 | icon-192/512 stubs | `public/manifest.json:12` + replace 2 files | Trivial — replace assets |
| 2 | why-bg.webp missing | `src/shells/dang/WhyChooseUs.tsx:35` | Trivial — 1 string change |
| 3 | holiday_mode wrong table+method | `src/shells/dang/hooks/useHolidayMode.ts:43` | Small — rewire to HolidayBanner |
| 4 | empty page_slug | `src/hooks/usePageContent.ts:17` | 1 line stops errors; deeper fix is optional |
| 5 | sort_order missing on testimonials | `src/shells/dang/TestimonialsSection.tsx:43` | Trivial — 1 string change |

All 5 are fixable in a single session. No error requires schema changes or new tables.
