-- S262 (final latch) — tenants.entitlement SET NOT NULL.
-- Applied live via MCP after provision-tenant v97 shipped (which guarantees every
-- new tenant gets an explicit entitlement), so this migration is already reflected
-- in schema_migrations. Adding the file makes the repo equal the DB; a
-- `supabase db push` will treat it as already-applied (version match → no-op).
-- This is the deferred latch from the phased D2 column rollout: nullable-first →
-- backfill → CHECK (1–4) → (this) NOT NULL.

alter table public.tenants alter column entitlement set not null;
