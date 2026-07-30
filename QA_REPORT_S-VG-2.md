# QA Report — S-VG-2: Vita Glow Shell Rework

**Date:** 2026-07-29
**Branch:** `claude/vita-glow-shell-713b3f`
**QA author:** Claude Code
**Verdict:** ✅ PASS on all code deliverables (serif bug fixed & proven, palette cream-led, logo rendering wired). ⛔ ONE item BLOCKED by environment: logo **hosting** (Supabase Storage upload + `branding.logo_url` DB write) — no file on disk, no Supabase access this session. Rendering code is complete and activates when Scott sets `branding.logo_url`.

---

## Serif bug — reproduced, root-caused, fixed, re-verified

Live host was unreachable from this session (HTTP 403 / Vercel protection), so diagnosis used the **real built font CSS** in a headless Chromium computed-style harness.

| Step | Setup | Computed `font-family` on h1 | Meaning |
|---|---|---|---|
| Repro (old form) | `--vg-font-display: var(--font-cormorant),'Cormorant Garamond',serif` at `:root`; `--font-cormorant` on wrapper div; ancestor `font-sans` | `ui-sans-serif, system-ui, Arial, sans-serif` | ❌ BUG reproduced (inherited sans) |
| Isolation | intermediate `:root` prop with nested `var()` vs. family placed **directly** | nested → invalid/inherited; direct → real Cormorant | root cause = nested-var scope |
| Fix (new form) | `--vg-font-display: "<next/font family>", …, serif` baked from `cormorantFont.style.fontFamily`, no nested var | `__Cormorant_Garamond_16bb0c, __Cormorant_Garamond_Fallback_16bb0c, "Cormorant Garamond", serif` | ✅ real self-hosted Cormorant |

Faithful post-fix render (real built CSS + exact injected token + wrapper class + `font-sans` ancestor):
- h1 → `__Cormorant_Garamond_16bb0c …` ✅
- h2 → `__Cormorant_Garamond_16bb0c …` ✅
- body → `__Jost_1c3766 …` ✅

Screenshot captured (`/tmp/vg-serif-proof.png`, shared with Scott): cream ground, gold Jost eyebrow, espresso **Cormorant serif** headlines, Jost body. Build confirms the token resolves at runtime from `cormorantFont.style.fontFamily` (family `__Cormorant_Garamond_16bb0c` present in `.next`) — no `undefined`.

---

## Checks walked

| # | Check | Expected | Actual | Result |
|---|-------|----------|--------|--------|
| 1 | Cormorant renders on display headings | real Cormorant family | `__Cormorant_Garamond_16bb0c` on h1/h2 | ✅ |
| 2 | `tsc --noEmit -p tsconfig.next.json` | 0 errors | 0 errors | ✅ |
| 3 | `next build` | success | success | ✅ |
| 4 | `eslint` new/changed | 0 errors | 0 errors (1 pre-existing refresh warning) | ✅ |
| 5 | Palette cream-led, no dark panels | hero-right/treatments/footer/cta all cream | confirmed in tokens + guard output | ✅ |
| 6 | Guard vs hostile `primary=#ff0000, accent=#00ff00` | palette fixed | primary `#3B2A21`, accent `#C9A227`, hero `#F7F2E9`, footer `#EFE7D8`, cta `#EFE7D8` | ✅ |
| 7 | Files < 200 lines | < 200 | max 123 (`VitaGlowHome.tsx`) | ✅ |
| 8 | Booking config-driven, blank | no hardcoded Square URL | 0 literals; empty → `/contact` | ✅ |
| 9 | No public clinical/dosing content in defaults | none | none | ✅ |
| 10 | Logo rendered on cream only, glyph fallback | nav/hero/footer `<img>` when set, all cream | confirmed | ✅ |
| 11 | Reduced-motion + visible focus | respected | `.vg-focus` outline + `prefers-reduced-motion` guard | ✅ |
| 12 | Split hero + gold seam + rotated label | matches v3 | implemented (responsive; seam hidden on mobile) | ✅ |
| 13 | Content still from `page_content` | nothing hardcoded | copy/services/prices from content | ✅ |
| 14 | Logo hosting (Storage + `branding.logo_url`) | file hosted, URL set | ⛔ BLOCKED (see below) | ⛔ |

---

## ⛔ BLOCKED: logo hosting — needs Scott (or a session with Supabase access)

Could not complete because, in this session:
1. The uploaded `ng-logo-clean.png` is **not on the filesystem** — searched `/` for recent PNG/WebP/JPG; only the inline chat image exists, which is not a readable file path.
2. **No Supabase Storage upload path** — no `supabase` CLI, no service-role/anon credentials in env/`.env`, Supabase MCP is disconnected, and no Storage-upload MCP tool exists (MCP `execute_sql` cannot upload a binary object).

I deliberately did **not** set `settings.branding.logo_url`: pointing it at the target URL before the file is uploaded would render a broken `<img>` in the (now cream) nav/hero/footer. The rendering code already handles `branding.logo_url` with a glyph fallback, so nothing breaks while it stays unset.

**To finish (Scott, or a Supabase-enabled run):**
1. Upload the logo PNG to Storage — bucket `logos`, path `8e0d8d7d-2c1d-4e25-b480-766e8cd6885f/logo.png`.
2. Set `settings.branding.logo_url` for the vita-glow tenant to:
   `https://biezzykcgzkrwdgqpsar.supabase.co/storage/v1/object/public/logos/8e0d8d7d-2c1d-4e25-b480-766e8cd6885f/logo.png`
3. Rendering activates automatically (nav/hero/footer render the logo on cream; glyph fallback otherwise).

---

## Post-merge follow-up (not blocking)
1. Complete the logo hosting above.
2. Load `vita-glow.pestflowpro.ai` and confirm: Cormorant on all headings, cream-led with espresso accents only, split hero + gold seam, cream treatments band, logo on cream.
3. Consider a follow-up to check `dang` / `bold-local` for the same nested-var font pattern (flagged in REVIEW).
