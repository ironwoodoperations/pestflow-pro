# PestFlow Pro — Roadmap

*State as of S266 (2026-06-14). Update at end of each session; retire the versioned pestflow-pro-todo-vNNN.html snapshots.*

---

## In Progress

*(nothing active — clear to start next session)*

---

## Recently Shipped

- **Theming Phase 1.5 — bold-local public inner-page dark conversion (S267, shipped PR #194).** `--color-*` block synced to BL_TOKENS charcoal + new `--color-body-text: #C9CDD2` / `--color-text-muted: #9AA3AD` tokens + `computeShellCssVars`/`applyTheme` bold-local guard (palette = accent only). Per-component edits gated behind `template === 'bold-local'` across the **9 verified render sites** (service-area branch, `faq`, `blog`, `blog/[post]`, `LegalPageLayout`, `CityFaqAccordion`, `WhyChooseUs` + the unchanged `Process`/`CtaBanner`) — Dang/modern-pro byte-identical. Validator gate: all 13 charcoal pairings PASS AA (worst 6.47:1); WhyChooseUs white-on-amber fixed 2.03→16.55:1. Verified charcoal live on prod (urban-strike). Full handoff: `docs/handoffs/pestflow-pro-handoff-S267-shipped.md`.

---

## Next Up

- Tops onboarding shell decision — prospect meeting this week; onboarding mechanism verified via provision-tenant v97 read; standard render_model=standard path is clear for a customer who accepts an existing shell+palette
- Remi warm transfer — configure VAPI assistant with transfer tool and transferPlan; voice-intake transfer branch already built; pure VAPI-dashboard work
- Claire two-identity setup — murphygurl92→Dang admin profile repoint + claire@homeflowpro.ai operator login; sequence both together

---

## Open Follow-ups

- bold-local FAQ category label ("General") renders red on charcoal (prod, urban-strike) — a category-tag color outside the S267 `--color-*` conversion scope; harmonize with the bold-local palette (amber). Cosmetic, low priority, non-blocking.
- bold-local service-page "OUR HIT PLAN" section-label renders dim against charcoal (prod, urban-strike) — check legibility / intended contrast (likely a muted eyebrow that needs a brighter token on the dark surface). Cosmetic, low priority, non-blocking.
- provision-tenant v97 hardcodes pestflowpro.com in legal pages and liveUrl — should be .ai; low priority
- Role-store single-source-of-truth — legacy profiles.role vs tenant_users.role disagreements only; no new tenants affected; low priority
- No-credential provision-path hardening — provision-tenant skips profile write when no admin email/password resolved; never triggered in practice; optional defensive note
- export-tenant-data capability — portable tenant-scoped export for churn portability; P2 backlog
- Remi ring-delay / no-answer forwarding — what happens on unanswered calls; parked; message-capture mode is viable now
- PROJECT_MANIFEST per-session log churn — accumulated session entries create noise; harmless; clean up when convenient
