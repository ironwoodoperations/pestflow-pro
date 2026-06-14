-- S264 — server-side location-cap backstop (PR #185 item 5 follow-up).
-- location_data is a VIEW over service_areas; the trigger goes on the base table.
-- Cap ladder by tenants.entitlement: 1=3, 2=5, 3=10, 4+=unlimited.
-- Grandfathers existing over-cap rows (count check only blocks NEW inserts at/over cap).
-- apex-protect is ent 1 with 5 rows today — keeps all 5, cannot add a 6th.

CREATE OR REPLACE FUNCTION public.enforce_location_cap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_entitlement smallint;
  v_cap integer;
  v_count integer;
BEGIN
  SELECT entitlement INTO v_entitlement FROM public.tenants WHERE id = NEW.tenant_id;

  IF v_entitlement IS NULL THEN
    RETURN NEW;
  END IF;

  v_cap := CASE v_entitlement
    WHEN 1 THEN 3
    WHEN 2 THEN 5
    WHEN 3 THEN 10
    ELSE NULL
  END;

  IF v_cap IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO v_count FROM public.service_areas WHERE tenant_id = NEW.tenant_id;

  IF v_count >= v_cap THEN
    RAISE EXCEPTION 'location_cap_exceeded: tenant % at entitlement % is limited to % locations (currently has %)',
      NEW.tenant_id, v_entitlement, v_cap, v_count
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_location_cap ON public.service_areas;
CREATE TRIGGER trg_enforce_location_cap
  BEFORE INSERT ON public.service_areas
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_location_cap();
