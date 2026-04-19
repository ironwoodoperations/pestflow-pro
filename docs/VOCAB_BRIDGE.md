# PestFlow Pro — Canonical Vocabulary Bridge

_Last updated: s159.2.7 — authoritative reference for all naming going forward._

---

## 1. Canonical Term Table

| Canonical term | Retired / banned term | Scope | Notes |
|---|---|---|---|
| **theme** | shell | Code symbols, CSS vars, UI labels | `shellThemes.ts` filename deferred; exports already use `theme*` |
| **tenant** | — | DB rows, RLS policies, internal code | Internal identity; never shown to end users |
| **client** | tenant (user-facing) | Ironwood Ops UI, Scott-facing surfaces | How Scott refers to the businesses he sells to |
| **customer** | tenant, client (public surfaces) | Public-facing copy, contact forms, booking | Visitors and leads on the white-label site |
| **service_area** | location | DB column (migration deferred), code symbols | `location_data` table rename deferred to 1.3 |
| **service page** (compound) | pest page, seo page | URL slugs, admin nav labels | Two words, no hyphen in prose; slug-friendly in paths |
| **plan** | package, subscription | Marketing copy, pricing UI | Stripe product names still use old strings — deferred normalization |
| **setup fee** | onboarding fee, activation fee | Invoices, Stripe line items, Ironwood UI | One-time charge; distinct from recurring plan price |
| **tier** | level, package tier | Internal subscription ranking (1–4) | Integer 1–4 in DB; maps to Starter/Grow/Pro/Elite plan names |

---

## 2. The Three-Layer Tenant / Client / Customer Seam

Three distinct audiences map to the same underlying `tenant_id`, but each word
signals a different surface and must never bleed across layers.

```
tenant    →  DB / RLS / edge functions / service-role code
client    →  Ironwood Ops UI (Scott's CRM, pipeline, provisioning)
customer  →  Public white-label site (visitor, lead, booking form)
```

### Why the seam matters

Using "tenant" in user-facing copy confuses Scott's clients ("am I a tenant?").
Using "client" in public copy leaks B2B framing to homeowners.
Using "customer" in Ironwood Ops blurs who owns the relationship.

### Code example

```ts
// BAD — leaks "tenant" into a customer-facing webhook handler label
async function handleTenantLeadWebhook(tenantId: string, payload: LeadPayload) {
  // ...
}

// GOOD — internal symbol uses "tenant"; public-surface label is "customer"
async function handleCustomerLeadWebhook(tenantId: string, payload: LeadPayload) {
  // tenantId is correct: it's an internal FK, not shown to anyone
  // function name describes the *event* from the customer's perspective
}
```

Rule of thumb: **the argument name can say `tenantId`; the function name
describes the surface it serves.**

---

## 3. Deferred Items (reserved for milestone 1.3)

These renames were intentionally left out of the s159.2 hygiene pass to keep
the diff reviewable. Do not rename them early.

| Item | Current state | Target state |
|---|---|---|
| `location_data` DB table | unchanged | rename to `service_areas` |
| `src/shells/` directory | unchanged | rename to `src/themes/` |
| File names inside `src/shells/` (e.g. `getShellImage.ts`) | "shell" in filename | rename to `getThemeImage.ts` etc. |
| `src/lib/shellThemes.ts` | "shell" in filename; exports already `theme*` | rename file to `src/lib/themes.ts` |
| Stripe product display names | "Starter Package" / "Grow Package" etc. | normalize to "Starter Plan" etc. |

---

## 4. Naming Debt — Shell Files That Kept "shell" While Exports Renamed to "theme\*"

Running `find src/shells -name "*.ts"` as of s159.2.7 surfaces these files where
the filename still says "shell" but the module's exported symbols already use
the `theme` vocabulary:

| File | Retained "shell" token | Exported as |
|---|---|---|
| `src/lib/shellThemes.ts` | filename | `ThemePalette`, `THEME_CONFIGS`, `applyTheme`, `getPalettesForTheme` |
| `src/shells/_shared/getShellImage.ts` | filename + function name | (function not yet renamed) |

All other `.ts` files under `src/shells/` are data/content files whose names
do not reference the shell/theme vocabulary directly — no action needed on those.

The directory itself (`src/shells/`) is the largest remaining debt item and is
tracked as a deferred rename above.

---

## 5. Historical Record Note

The following locations contain **frozen** documents from earlier sessions and
must not be rewritten, amended, or deleted:

- `docs/handoffs/` — session handoff notes (chronological; append-only)
- `/mnt/project/` — snapshot artifacts from the pre-Codespace environment
- Prior session prompts (s159.1, s159.2.1–s159.2.6) stored in GitHub commit
  messages — those are the authoritative record of what changed and why

If information in a frozen doc conflicts with this file, **this file wins** for
going-forward decisions. Do not edit the frozen docs to resolve the conflict —
add a note here instead.
