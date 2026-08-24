# Session log — branch `s290-session-close`

_Per-session entries written by the Ironwood Stop hook. One file per branch so
independent branches never conflict on a shared log (S261-3). Index: ../PROJECT_MANIFEST.md._

---
## Session — 2026-08-24 04:17 UTC
- Branch: `s290-session-close`
- Commit: `f0d6724` — docs(s290): session close — ROADMAP update + S290 handoff
- Author: Claude
- Files changed:
  - docs/ROADMAP.md
  - docs/handoffs/pestflow-pro-handoff-S290-provisioning-deployed.md
- Next recommended action: **S292 — `Onboarding.tsx` `handleLaunch` drops TWELVE `business_info` keys.**
  It writes the row as a whole replacement value. S290 preloaded `vertical` so that one survives; the
  rest still go: address_country, address_locality, address_region, street_address, postal_code,
  latitude, longitude, geocode_source, timezone, founded_year, certifications, num_technicians.
  `founded_year` is what `settings.about`'s `auto:years_operating` resolves from — it is how PLS's
  "9+ years" renders publicly. THE FIX IS MERGE, NOT ENUMERATE: read the current business_info,
  spread it, overlay the form fields.
  Then S291 (Claude as a third AI Authority engine) — unblocked now that provision-tenant is deployed.
- Deployment state at close: `provision-tenant` **v99 ACTIVE** (deployed via Supabase CLI, verified via
  MCP `get_edge_function`), `generate-monthly-report` v11. Nothing from this arc is inert. Do not
  re-propagate any "merged but not deployed" claim about either.

---
## Session — 2026-08-24 04:23 UTC
- Branch: `s290-session-close`
- Commit: `699bdc0` — docs(s290): three corrections before merge — one of them is occurrence nine
- Author: Claude
- Files changed:
  - docs/ROADMAP.md
  - docs/handoffs/pestflow-pro-handoff-S290-provisioning-deployed.md
- Next recommended action: unchanged — **S292** (`handleLaunch` drops twelve `business_info` keys; the
  fix is MERGE, not enumerate), then **S291**. See the entry above for detail.
- Carried from the corrections in this commit, for whoever picks up S292:
  - **`tenant_role_binding_drift` does NOT detect a missing `profiles` row.** It scans
    `profiles` → `tenant_users`; the PLS failure was the mirror. Use the reverse query in the handoff.
  - **Two rows are still half-bound**, both Scott's accounts: `dang` (role `user`) and `vita-glow`
    (role **admin**). No client account affected. Vita Glow's is the tenant admin — fix it BEFORE that
    project unparks, or it will present as "Locations is empty" and an RLS error on upload.
  - **Warm transfer is LIVE** via Retell agent configuration. `voice-intake-retell` has no transfer
    branch because it does not need one. Do not rebuild it.
