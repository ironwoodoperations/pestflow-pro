-- S335 ROLLBACK — drop public.tenant_services.
--
-- SAFE WHILE THE TABLE IS INERT, and only while it is inert. Nothing reads it,
-- no policy references it, and no foreign key points AT it (its own FK points
-- outward, at tenants). Dropping it therefore cannot break a rendering path.
--
-- DESTRUCTIVE: this discards the per-tenant selections (77 rows across 7
-- tenants at the time of writing). They were derived from page_content, so they
-- can be rebuilt from it — but they are not recoverable from this file.
--
-- ONCE THE READ PATH LANDS, THIS FILE IS NO LONGER A ROLLBACK. A tenant's
-- rendered service list would depend on these rows, and dropping the table
-- would empty every tenant's nav, tiles and sitemap. At that point the correct
-- rollback is whatever the read-path change ships with, not this.

drop table if exists public.tenant_services;

notify pgrst, 'reload schema';
