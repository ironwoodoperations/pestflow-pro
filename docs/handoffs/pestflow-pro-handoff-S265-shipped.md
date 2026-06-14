# PestFlow Pro — S265 Handoff (SHIPPED)

**Date:** 2026-06-14 · **Session:** S265 · **Orchestrator:** Claude.ai (MCP-first)
**Theme:** Tops onboarding question → became a theming-architecture audit. No code shipped; key architectural finding logged.

---

## What this session set out to do

Roadmap "Next Up" #1 was the Tops onboarding shell decision (shared shell vs standalone). Tops turned out to be a prospect (meeting this week), NOT a signed customer. The real question became a capability test: can we onboard a customer who wants a look that isn't one of our default shells?

---

## What was actually done

### 1. Disposable-tenant test (created + verified + torn down, all via MCP)
- Created `zz-shelltest-s265` (id `5fe14f52-0f6f-4459-bd4f-455870d3afc2`), name "Summit Pest Solutions", entitlement 4 (Elite), render_model `standard`, theme `bold-local`, blue palette (#1B6FB3) — mirroring provision-tenant v97's insert sequence via direct SQL (no auth user, no prospect side-effects). 12 settings keys, 17 page_content rows, 3 service_areas.
- Rendered live. Home page showed charcoal/amber (the real bold-local shell); blog page showed blue. This split IS the finding (see below).
- Torn down via `admin_delete_tenant` RPC. Verified against live DB: tenant count 8→7, 0 orphan rows (settings/page_content/service_areas all 0). Clean.

### 2. Theming architecture audit (read-only)
- Traced bold-local color resolution end-to-end across the full stack: `BL_TOKENS` → `shared/lib/shellCssVars.ts` → `src/lib/shellThemes.ts` → admin SPA.
- Confirmed that all three sources disagree and that the palette-picker does not authoritatively drive the public site. See headline finding below.

---

## HEADLINE FINDING — theming has three unsynced color sources

The public site's color comes from up to three independent places that do not agree:

| Source | Layer | bold-local value |
|--------|-------|-----------------|
| `BL_TOKENS` (`app/tenant/[slug]/_shells/bold-local/BoldLocalFonts.ts`) | Next.js public shell components | cool charcoal `#0F1216` surface |
| `shared/lib/shellCssVars.ts` | Next.js server-side, shared components (contact forms etc.) | warm amber-brown `#2d1a00` hero, light `#f5f5f5` section |
| `src/lib/shellThemes.ts` | Vite SPA (admin / intake / preview) | **MISSING** — falls back to `modern-pro` |

**Consequence:** on one bold-local page, shell components paint cool charcoal (`--bl-*` vars) while shared components paint warm-brown/light (`--color-*` vars), and the admin SPA previews a third thing. This is the root cause of the charcoal-home / blue-blog split seen in the test.

The palette-picker does NOT authoritatively drive the public site. Scott's product requirement (shell = layout, palette = color, customer picks both) is NOT met today on the public site for at least bold-local.

---

## Corrected facts (prior beliefs that were wrong)

- **bold-local is NOT deleted.** S193 retired only the Vite-era `src/shells/bold-local/`. The Next.js shell at `app/tenant/[slug]/_shells/bold-local/` (15 components, `BL_TOKENS`, Barlow Condensed font) is fully alive and ships today.
- **urban-strike renders bold-local correctly on its public site.** It is only broken in the Vite SPA admin/branding preview (no `THEME_CONFIGS` entry → modern-pro fallback there). Earlier claim that it was "silently falling back since S193" was wrong — true only of the SPA layer, not the public site.
- **The theme key is `metro-pro`, not `metro-pro-shell`.** Confirmed by both historical context files and the live `SHELL_THEMES` block in `shellCssVars.ts`. A mid-session grep summary said `metro-pro-shell` — that was a misread of the Vite `THEME_CONFIGS` key, which differs from the Next.js key.
- **Live DB theme values:** `bold-local` (urban-strike), `clean-friendly` (coastal-pest), `metro-pro` (metro-pest-concierge, pestflow-pro), `modern-pro` (apex-protect, dang), `rustic-rugged` (heartland-pest).
- **Both builds ship and stay.** `npm run build` = `build:vite && build:next`. No retirement plan for either in ROADMAP or handoffs.
- **`shellThemes.ts` is Vite-SPA-only.** 8 consumers, all in `src/`. The Next.js public renderer never imports it.

---

## Verified live-state facts (carry forward)

- Tenant roster (7): pestflow-pro, dang, heartland-pest, metro-pest-concierge, apex-protect, coastal-pest, urban-strike. `zz-shelltest-s265` fully torn down, 0 orphans.
- `admin_delete_tenant` RPC cascade is clean: settings, page_content, service_areas, all child rows drop atomically.
- `shared/lib/shellCssVars.ts` is the server-side twin of `src/lib/shellThemes.ts`. It already has `bold-local` defined (warm-brown values, NOT matching BL_TOKENS). It also has three `PALETTE_HERO` entries not yet mirrored in `shellThemes.ts`: `#e87800`, `#b91c1c`, `#15803d`.
- `provision-tenant v97` hardcodes `*.pestflowpro.com` in legal-page templating and the returned `liveUrl` — drift vs canonical `.ai`. Minor (text/response only).
- The S158 bold-local redesign spec (charcoal `#0F1216` + amber `#F5A623`, Barlow Condensed / Inter) matches `BL_TOKENS`' cool-charcoal intent — that is the closest thing to a design source of truth for the shell.

---

## DECISION REQUIRED next session (blocks any theming PR)

Pick the single source of truth for shell colors, and whether palette overrides it. Three options:

1. **Per-shell Next.js tokens canonical (recommended — phase 1).** `BL_TOKENS` is the design spec; palette selects accent only. Sync `shellCssVars.ts` and `shellThemes.ts` to the BL_TOKENS cool-charcoal values. Smallest scope.
2. **Tenant palette canonical.** All three layers read `branding.primary/accent`. Matches Scott's stated goal (shell = layout, palette = color). Biggest work — requires Next.js shells to read tenant colors instead of hardcoding. Phase 2 scope.
3. **`shellCssVars.ts` as single server authority.** `BL_TOKENS` refactored to read from it; Vite mirrors. Consolidation path.

**Orchestrator recommendation:** phased 1 → 2. First make the three sources agree (adopt cool-charcoal `BL_TOKENS` values as canonical, sync `shellCssVars.ts` + `shellThemes.ts` to match) so the SPA preview is honest and drift stops. Then a separately-scoped project to make palette authoritative across public shells. Do NOT attempt option 2 in one blind PR — risks the live paying customer's site.

---

## Open / pending (carried to next)

- **Theming source-of-truth consolidation** — decision above required first; then phase 1 PR. Blocks offering shell+palette choice to customer #2.
- **bold-local SPA gap** — add `bold-local` to `src/lib/shellThemes.ts` (`THEME_CONFIGS` + `PALETTES bl-*` + `PALETTE_HERO` + `themeKey` union); fold into theming consolidation, not standalone.
- **CLAUDE.md stale shell list** — correct to real five shells inside the theming PR (held per prior decision).
- **Tops onboarding** — prospect meeting this week; `provision-tenant v97` standard path is clear for a customer who accepts an existing shell+palette; no blocker on the provisioning side.
- **Remi warm transfer**, **Claire two-identity** — unchanged, still queued.
