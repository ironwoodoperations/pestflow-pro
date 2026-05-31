-- S249 ROLLBACK — tenants.render_model column.
-- NOTE: middleware reads the STANDALONE_TENANT_SLUGS env var at runtime, NOT this
-- column. For a routing-only revert, clear/restore the Vercel env var and redeploy
-- (env-var change alone does not propagate without a deploy). Dropping the column is
-- only needed to fully back out the schema change.
ALTER TABLE public.tenants DROP COLUMN render_model;

NOTIFY pgrst, 'reload schema';
