# S273 — protect-files.sh temporary relaxation (PR #1 auth reroute)

**Date:** 2026-06-17
**Authorized by:** Scott
**Branch:** claude/adoring-ritchie-0abf2a (PR #207)

Temporarily commented out three patterns in `.claude/hooks/protect-files.sh` to allow
PR #1's role-store reconciliation (18-edge-fn `profiles.role` → `tenant_users` reroute):
- `supabase/migrations/`
- `supabase/functions/_shared/auth/`
- `supabase/functions/provision-tenant/`

Left ACTIVE: `.env`, `doppler.yaml`, `ironwood-provision/`, `stripe-webhook/`,
`create-checkout-session/`, `src/integrations/supabase/client`, `rls.*.sql$`.

**RESTORE the three patterns before #207 merges to main.** Restore via the byte-for-byte
backup at `.claude/hooks/protect-files.sh.bak`, then update this entry to note restored.

GIT_RULES escape-hatch: human-authorized, scoped, temporary, logged.
