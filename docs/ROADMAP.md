# PestFlow Pro — Roadmap

*State as of S266 (2026-06-14). Update at end of each session; retire the versioned pestflow-pro-todo-vNNN.html snapshots.*

---

## In Progress

*(nothing active — clear to start next session)*

---

## Next Up

- Theming Phase 1.5 — bold-local public inner-page dark conversion — bold-local home renders shell sections (--bl-* charcoal) but inner routes (service/blog/faq/legal, all _components/sections/*) render SHARED components reading --color-* warm-brown: this IS the S265 charcoal-home/warm-inner split, confirmed in source S266. Converting --color-* to charcoal for bold-local requires a 38-component text-color contrast audit (no --color-text/--color-body-text token exists; body text is Tailwind-default, not token-driven) — own scoped session, validator-gated. BLOCKS full shell+palette choice to customer #2; SPA preview honesty already shipped S266.
- Tops onboarding shell decision — prospect meeting this week; onboarding mechanism verified via provision-tenant v97 read; standard render_model=standard path is clear for a customer who accepts an existing shell+palette
- Remi warm transfer — configure VAPI assistant with transfer tool and transferPlan; voice-intake transfer branch already built; pure VAPI-dashboard work
- Claire two-identity setup — murphygurl92→Dang admin profile repoint + claire@homeflowpro.ai operator login; sequence both together

---

## Open Follow-ups

- provision-tenant v97 hardcodes pestflowpro.com in legal pages and liveUrl — should be .ai; low priority
- Role-store single-source-of-truth — legacy profiles.role vs tenant_users.role disagreements only; no new tenants affected; low priority
- No-credential provision-path hardening — provision-tenant skips profile write when no admin email/password resolved; never triggered in practice; optional defensive note
- export-tenant-data capability — portable tenant-scoped export for churn portability; P2 backlog
- Remi ring-delay / no-answer forwarding — what happens on unanswered calls; parked; message-capture mode is viable now
- PROJECT_MANIFEST per-session log churn — accumulated session entries create noise; harmless; clean up when convenient
