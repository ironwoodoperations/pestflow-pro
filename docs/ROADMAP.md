# PestFlow Pro — Roadmap

*State as of S265 (2026-06-14). Update at end of each session; retire the versioned pestflow-pro-todo-vNNN.html snapshots.*

---

## In Progress

*(nothing active — clear to start next session)*

---

## Next Up

- Theming source-of-truth consolidation — three unsynced color sources (BL_TOKENS / shared/lib/shellCssVars.ts / src/lib/shellThemes.ts) disagree; palette-picker does not drive public site; see S265 handoff for decision options; phase 1 = sync all three to cool-charcoal BL_TOKENS values; phase 2 = make tenant palette authoritative on public shells; BLOCKS offering shell+palette choice to customer #2
- Tops onboarding shell decision — prospect meeting this week; onboarding mechanism verified via provision-tenant v97 read; standard render_model=standard path is clear for a customer who accepts an existing shell+palette
- Remi warm transfer — configure VAPI assistant with transfer tool and transferPlan; voice-intake transfer branch already built; pure VAPI-dashboard work
- Claire two-identity setup — murphygurl92→Dang admin profile repoint + claire@homeflowpro.ai operator login; sequence both together

---

## Open Follow-ups

- bold-local SPA gap — add bold-local to src/lib/shellThemes.ts (THEME_CONFIGS + PALETTES bl-* + PALETTE_HERO + themeKey union) so admin/intake preview stops falling back to modern-pro; fold into the theming consolidation, not standalone
- CLAUDE.md stale shell list — currently lists four shells including a wrong key; correct to the real five: modern-pro | clean-friendly | rustic-rugged | metro-pro | bold-local; fix inside the theming PR
- provision-tenant v97 hardcodes pestflowpro.com in legal pages and liveUrl — should be .ai; low priority
- Role-store single-source-of-truth — legacy profiles.role vs tenant_users.role disagreements only; no new tenants affected; low priority
- No-credential provision-path hardening — provision-tenant skips profile write when no admin email/password resolved; never triggered in practice; optional defensive note
- export-tenant-data capability — portable tenant-scoped export for churn portability; P2 backlog
- Remi ring-delay / no-answer forwarding — what happens on unanswered calls; parked; message-capture mode is viable now
- PROJECT_MANIFEST per-session log churn — accumulated session entries create noise; harmless; clean up when convenient
