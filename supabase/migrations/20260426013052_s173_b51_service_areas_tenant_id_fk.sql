-- Migration: s173_b51_service_areas_tenant_id_fk
-- Purpose: Add missing FK constraint on service_areas.tenant_id -> tenants.id
-- Audit (S173.0): 36 rows, 0 nulls, 0 orphans. Column already uuid NOT NULL.
-- ON DELETE RESTRICT chosen to layer with existing guard_protected_tenant_delete
-- and guard_bulk_delete triggers. Composite UNIQUE(tenant_id, slug) already
-- provides the index needed for FK lookups.

ALTER TABLE public.service_areas
  ADD CONSTRAINT service_areas_tenant_id_fkey
  FOREIGN KEY (tenant_id)
  REFERENCES public.tenants(id)
  ON DELETE RESTRICT
  ON UPDATE NO ACTION;
