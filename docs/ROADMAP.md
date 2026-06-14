# PestFlow Pro — Roadmap

*State as of S264 (2026-06-14). Update at end of each session; retire the versioned pestflow-pro-todo-vNNN.html snapshots.*

---

## In Progress

- PR #186 — repo-truth migration commit for location-cap trigger; no behavior change, awaiting merge

---

## Next Up

- Tops onboarding shell decision — PFP shared shell vs standalone custom shell; this is the gate before customer #2 can be provisioned
- Remi warm transfer — configure VAPI assistant with transfer tool and transferPlan; voice-intake transfer branch already built; pure VAPI-dashboard work
- Claire two-identity setup — murphygurl92→Dang admin profile repoint + claire@homeflowpro.ai operator login; sequence both together

---

## Open Follow-ups

- Role-store single-source-of-truth — legacy profiles.role vs tenant_users.role disagreements only; no new tenants affected; low priority
- No-credential provision-path hardening — provision-tenant skips profile write when no admin email/password resolved; never triggered in practice; optional defensive note
- export-tenant-data capability — portable tenant-scoped export for churn portability; P2 backlog
- Remi ring-delay / no-answer forwarding — what happens on unanswered calls; parked; message-capture mode is viable now
- PROJECT_MANIFEST per-session log churn — accumulated session entries create noise; harmless; clean up when convenient
