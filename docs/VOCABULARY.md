# PestFlow Pro / HomeFlow Pro — Canonical Vocabulary

_Locked: S159.2 (Phase 1 unification). Validated by Perplexity + Gemini._

## Canonical terms

| Concept | Canonical | Deprecated | Where enforced |
|---|---|---|---|
| Visual design system | theme | shell, template | Code + UI |
| Business on platform | tenant (code) / client (UI) / customer (Stripe) | — | Three-layer split |
| City/region served | service_area / serviceArea / ServiceArea | location, city, service area (lowercase drift) | Code + UI |
| Per-service landing page | service-page compound — ServicePage / servicePage / service_page | pest page, service page (lowercase drift) | Code + UI |
| Recurring subscription | plan | package (when meant as subscription) | UI + code + Stripe |
| One-time setup charge | setup fee | setup, migration fee (drift) | UI + code |
| Internal pricing level | tier (numeric 1–4) | — | Code + DB only, NEVER user-facing |

## The three-layer tenant/client/customer seam

This is the vocabulary rule most likely to drift. Enforce at code review.

- **Code:** variable names, function names, types, file names → tenant, Tenant, tenantId
- **UI copy:** user-facing strings (admin pages, toasts, errors, labels) → "client"
- **Stripe integration:** webhook payloads, stripe_customer_id, mapping fields → customer

Example seam — Stripe webhook handler:

    // GOOD — explicit mapping at the seam
    const tenant = await getTenantByStripeCustomerId(event.data.object.customer);
    if (!tenant) throw new Error("No client found for this Stripe customer"); // UI-visible error uses "client"

    // BAD — drift inside server code
    const client = await getClientByStripeCustomerId(...); // should be tenant in code

## Deferred items (NOT renamed in S159.2)

These will be addressed in follow-up sessions:

- **DB schema renames** (S159.3): social_posts.scheduled_at, location_data.intro_video_url, profiles.role, page_content image cols, settings.hero_media sprawl
- **File name renames** inside src/shells/ (e.g., shellCssVars.ts -> themeCssVars.ts): deferred to dedicated file-rename session after test suite exists
- **Directory rename** src/shells/ -> src/themes/: deferred (no test suite, relative imports, high blast radius)
- **Stripe product/price name normalization**: reserved for Stripe live-mode cutover

## Naming debt as of S159.2

The following files keep their old "shell" filenames even though their exported symbols are now renamed to theme*. This is visible drift — tracked here, resolved in the dedicated file-rename session:

- src/lib/shellThemes.ts — exports ThemePalette, THEME_CONFIGS, getPalettesForTheme, applyTheme
- src/components/admin/client-setup/components/ShellSelector.tsx — exports ThemeSelector, ThemeSelectorProps
- src/shells/youpest/ShellHomeSections.tsx — uses applyTheme (file is in src/shells/ dir, dir rename deferred)
- Directory src/shells/ itself — rename to src/themes/ deferred (no test suite, relative imports, high blast radius)

DB column `settings.branding->template` stores the chosen visual system under key "template" (not "theme"). Code uses "theme" conceptually while the JSONB key remains "template" until S159.3 migrations.

## Historical record

Old markdown files in /docs/handoffs/, /mnt/project/, and prior session prompts are FROZEN. They use the deprecated terms in context. Do not rewrite history. This doc is the bridge.
