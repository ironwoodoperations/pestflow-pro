-- S326 ROLLBACK — reverses s326_ai_authority_prompts_unique.sql.
--
-- DELIBERATELY has no timestamp prefix, for the reason the S281 rollback gives:
-- a file named <timestamp>_*.sql in this directory is a migration the CLI will
-- APPLY, so a timestamped rollback sitting after the constraint would drop it on
-- the next `supabase db push` — the exact opposite of what it is for.
--
-- NOTE BEFORE RUNNING THIS. Dropping the constraint does not undo the upsert in
-- provision-tenant, which names it via onConflict. With the constraint gone, that
-- upsert fails (42P10: no unique or exclusion constraint matching the ON CONFLICT
-- specification) rather than silently duplicating — which is the safe direction,
-- but it means the code change should be reverted with it, not after it.
--
-- Run only on purpose, against a named environment.

alter table public.ai_authority_prompts
  drop constraint if exists ai_authority_prompts_tenant_prompt_key;

notify pgrst, 'reload schema';
