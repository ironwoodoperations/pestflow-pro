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
