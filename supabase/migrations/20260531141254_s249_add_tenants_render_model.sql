-- S249: data-driven standalone-tenant routing.
-- Adds render_model classification to tenants. 'standalone' = public site lives in a
-- separate Vercel project (e.g. Dang -> dangpestcontrol.com); middleware 404s its
-- non-admin paths on <slug>.pestflowpro.ai. 'standard' = served by this app's
-- /tenant/<slug> shell. Edge reads the STANDALONE_TENANT_SLUGS env projection of this
-- column; this column is the queryable source of truth.
ALTER TABLE public.tenants
  ADD COLUMN render_model TEXT NOT NULL DEFAULT 'standard'
  CHECK (render_model IN ('standard', 'standalone'));

UPDATE public.tenants SET render_model = 'standalone' WHERE slug = 'dang';

-- Additive column on a table read via PostgREST by get_tenant_boot (SECURITY DEFINER)
-- and provisioning — reload the schema cache so reads don't 400/500 on a stale cache.
NOTIFY pgrst, 'reload schema';
