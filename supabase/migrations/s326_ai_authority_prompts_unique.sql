-- S326 ITEM 2 — a unique key for ai_authority_prompts (tenant_id, prompt_text).
--
-- THE DEFECT. provision-tenant seeds this table with a plain INSERT of N
-- prompts. The table's ONLY constraint is PRIMARY KEY (id) on a
-- gen_random_uuid() default, so every row is trivially unique and nothing
-- rejects a repeat. A re-provision therefore wrote a SECOND FULL COPY of every
-- prompt for that tenant, and a third on the run after.
--
-- No tenant carries duplicates today. That is not a guard working — it is that
-- nothing has been re-provisioned since S289 added the insert. Verified before
-- writing this: 21 rows, 3 tenants, 0 duplicate groups, 0 surplus rows under
-- the key below, so the constraint applies without a dedupe step. A dedupe was
-- NOT written, because there is nothing to dedupe and a destructive step nobody
-- needs is a step that eventually runs against data that does.
--
-- WHY (tenant_id, prompt_text) AND NOT A SURROGATE. The prompt text IS the
-- identity: authorityPrompts.ts generates a deterministic set from the tenant's
-- name, city, live service areas and service slugs, so the same inputs must
-- yield the same rows rather than accumulating copies. Column name verified
-- against the live table (id, tenant_id, prompt_text, active, created_at) —
-- not assumed.
--
-- `active` IS DELIBERATELY NOT IN THE KEY. An operator turning a prompt off
-- must not have a re-provision turn it back on by inserting the "same" prompt
-- with active=true. Keeping active out of the key, plus ignoreDuplicates on the
-- upsert side, means an existing row is left exactly as the operator left it.
--
-- DELIBERATELY HAS NO TIMESTAMP PREFIX. This was applied via apply_migration,
-- which stamps schema_migrations but does not write a file. A timestamped file
-- would be applied a SECOND time by the next `supabase db push`; the CLI skips
-- files that do not match the timestamp convention, so this one is a record and
-- is inert. Its rollback sits beside it, same reasoning.

alter table public.ai_authority_prompts
  add constraint ai_authority_prompts_tenant_prompt_key unique (tenant_id, prompt_text);

notify pgrst, 'reload schema';
