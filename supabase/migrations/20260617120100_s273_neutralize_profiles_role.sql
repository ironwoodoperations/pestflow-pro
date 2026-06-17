-- S273 — Role-store SSOT reconciliation (part 2 of 2): retire profiles.role.
--
-- ⚠️ ORDERING-SENSITIVE — APPLY ONLY AFTER the reroute code is DEPLOYED and Vercel /
-- edge functions report READY. profiles.role was the de-facto server-side privilege
-- gate read by 18 edge functions via supabase/functions/_shared/auth/requireTenantUser.ts
-- (and the inline copy in outscraper-reviews). PR #1 reroutes all of them to
-- tenant_users.role. Dropping this column BEFORE that code is live would blank the gate
-- underneath running functions (every requireTenantUser call would 403).
--
-- Apply sequence (Claude.ai via Supabase MCP):
--   1. Confirm the PR #1 reroute is merged, deployed, and Vercel/edge READY.
--   2. apply_migration (this file).
--   3. The NOTIFY below reloads PostgREST's schema cache.
--
-- Rollback: docs/migrations/s273-neutralize-profiles-role-rollback.sql

begin;

alter table public.profiles drop column if exists role;

commit;

notify pgrst, 'reload schema';
