# PestFlow Pro — Roadmap

*State as of S266 (2026-06-14). Update at end of each session; retire the versioned pestflow-pro-todo-vNNN.html snapshots.*

---

## In Progress

- Theming Phase 1.5 — bold-local public inner-page dark conversion (S267 Wave 2, PR open) — `--color-*` block synced to BL_TOKENS charcoal + new `--color-body-text` / `--color-text-muted` tokens + `computeShellCssVars`/`applyTheme` bold-local guard (palette = accent only). The audit's "38-component" estimate was corrected to the **verified 9 render sites**: `[service]` service-area branch, `faq`, `blog`, `blog/[post]`, `LegalPageLayout`, `CityFaqAccordion`, plus `WhyChooseUs`/`Process`/`CtaBanner` (the latter two unchanged). Inner routes are SHARED across all 5 themes, so every per-component dark edit is gated behind `template === 'bold-local'` — Dang (modern-pro) is byte-identical. Validator gate (deterministic WCAG): all charcoal pairings PASS AA (worst 6.47:1). Pre-existing WhyChooseUs white-on-amber 2.03:1 fixed in its own commit. **Post-merge: ISR cache purge for affected bold-local tenants is a separate Claude.ai/MCP step.**
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
