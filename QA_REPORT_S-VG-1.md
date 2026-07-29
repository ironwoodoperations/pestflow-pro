# QA Report — S-VG-1: Vita Glow Wellness Shell

**Date:** 2026-07-29
**Branch:** `claude/vita-glow-shell-713b3f`
**QA author:** Claude Code
**Verdict:** ✅ PASS (build/static verification). Live end-to-end render is BLOCKED-BY-DESIGN until the tenant is provisioned via MCP (provisioning is explicitly out of scope for this PR).

---

## Why no live-browser walk
The shell renders only for a tenant whose `settings.branding.theme = 'vita-glow'`. No such tenant exists yet — provisioning (`vita-glow` tenant row + settings + `page_content`) is out of scope and happens via MCP after merge. So this QA verifies everything that is verifiable pre-provisioning: type safety, production build, font pipeline, route registration, the palette guard, and structural conformance. The single remaining check — visual render at `pestflowpro.ai/tenant/vita-glow` — is listed as post-provisioning follow-up.

---

## Checks walked

| # | Check | Expected | Actual | Result |
|---|-------|----------|--------|--------|
| 1 | `tsc --noEmit -p tsconfig.next.json` | 0 errors | 0 errors | ✅ PASS |
| 2 | `npm run build:next` | success | compiled + 6 static pages generated | ✅ PASS |
| 3 | `next/font/google` fetch (Cormorant Garamond, Jost) | fonts self-host at build | no font-fetch error; build clean | ✅ PASS |
| 4 | `/tenant/[slug]/consult` route registered | present in route table | `● /tenant/[slug]/consult` (SSG) | ✅ PASS |
| 5 | `eslint` new/changed files | 0 errors | 0 errors (10 pre-existing style warnings only) | ✅ PASS |
| 6 | Palette guard vs hostile `primary_color=#ff0000, accent=#00ff00` | palette stays fixed | primary/accent `#C9A227`, hero `#FAF7F2`, btn-text/footer `#3D3733` | ✅ PASS |
| 7 | All shell files < 200 lines | < 200 | max 120 (`VitaGlowHome.tsx`) | ✅ PASS |
| 8 | Booking config-driven, ships blank | no hardcoded Square URL | `grep` for square URL → 0 literals; empty → `/contact` fallback | ✅ PASS |
| 9 | No public clinical/dosing content in defaults | none | no dosing/contraindication/protocol strings in components | ✅ PASS |
| 10 | Guard mirrors dang/bold-local pattern | early-return before preset/custom path | confirmed in `computeShellCssVars` | ✅ PASS |

### Check 6 detail (palette guard)
```
computeShellCssVars('vita-glow', '#ff0000', '#00ff00') →
  --color-primary : #C9A227  (gold — NOT red)
  --color-accent  : #C9A227  (gold — NOT green)
  --color-bg-hero : #FAF7F2  (cream)
  --color-btn-text: #3D3733  (ink)
  --color-footer-bg: #3D3733 (ink)
```
A tenant's `branding.primary_color` cannot re-derive the surfaces. Palette is fixed, as briefed.

### Check 8 detail (booking)
- `resolveBookingHref('')` → `{ href: '/contact', external: false }` (in-page consult fallback).
- `resolveBookingHref('https://squareup.com/…')` → `{ href: <url>, external: true }` (new-tab).
- Reads `settings.integrations.square_booking_url` only; ships blank. Nav, footer, home, services, about, contact, and consult all route through this one resolver.

---

## Definition-of-done trace

| DoD item | Status |
|---|---|
| `vita-glow` renders at `/tenant/vita-glow` once provisioned | ✅ wired (render pending provisioning) |
| 6 shell components + fonts + barrel present, each < 200 lines | ✅ |
| `SHELL_THEMES['vita-glow']` + `computeShellCssVars` guard | ✅ |
| Content reads from `page_content` / `blog_posts`; nothing hardcoded | ✅ (copy from content; nav/chrome labels in-component, per shell convention) |
| Booking CTA config-driven, ships blank | ✅ |
| No public-facing clinical/dosing content | ✅ |
| REVIEW + QA reports written | ✅ (this file + `REVIEW_S-VG-1.md`) |

---

## Post-provisioning follow-up (not blocking this PR)
1. Provision `vita-glow` tenant + `page_content` rows via MCP.
2. Load `pestflowpro.ai/tenant/vita-glow` and eyeball: asymmetric hero (glyph bleeds left), gold dividers, card grid cream→white hover, dark CTA band, footer badge.
3. Confirm `/iv-infusions`, `/injectables`, `/weight-wellness` render their `page_content`; a bogus slug 404s.
4. Confirm `/consult` renders and is noindex; confirm non-vita-glow tenants 404 on `/consult`.
5. With `square_booking_url` empty, confirm every Book CTA lands on `/contact`; set the URL and confirm new-tab Square hand-off.
