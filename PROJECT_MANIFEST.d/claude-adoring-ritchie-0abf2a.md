# Session log — branch `claude/adoring-ritchie-0abf2a`

_Per-session entries written by the Ironwood Stop hook. One file per branch so
independent branches never conflict on a shared log (S261-3). Index: ../PROJECT_MANIFEST.md._

---
## Session — 2026-06-17 12:28 UTC
- Branch: `claude/adoring-ritchie-0abf2a`
- Commit: `046e0af` — docs(s272): production outage post-mortem + handoff + roadmap (#206)
- Author: csdevore2
- Files changed:
  - PROJECT_MANIFEST.d/docs-s272-postmortem.md
  - docs/ROADMAP.md
  - docs/handoffs/pestflow-pro-handoff-S272-shipped.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-06-17 13:05 UTC
- Branch: `claude/adoring-ritchie-0abf2a`
- Commit: `619efe2` — feat(s273): role-store SSOT reconciliation — reroute to tenant_users, drop dead user_roles
- Author: Claude
- Files changed:
  - .github/workflows/ci.yml
  - docs/migrations/s273-drop-user-roles-has-role-rollback.sql
  - docs/migrations/s273-neutralize-profiles-role-rollback.sql
  - scripts/create-admin-user.mjs
  - scripts/provision-dang-user.ts
  - supabase/functions/_shared/auth/requireTenantUser.test.ts
  - supabase/functions/_shared/auth/requireTenantUser.ts
  - supabase/functions/outscraper-reviews/index.ts
  - supabase/functions/provision-tenant/index.ts
  - supabase/migrations/20260617120000_s273_drop_user_roles_has_role.sql
  - supabase/migrations/20260617120100_s273_neutralize_profiles_role.sql
- Next recommended action: [Fill in next session: read this line, write what comes next]
