-- S338 — public.provision_tenant_atomic(p_payload jsonb). The atomic provision.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- UNTIMESTAMPED ON PURPOSE. ALREADY APPLIED (stamped
-- s338_provision_tenant_atomic). Body read from the LIVE object on 2026-09-04
-- with pg_get_functiondef() and verified byte-identical by md5 against
-- pg_proc.prosrc. See the fileless-batch note in
-- s338_page_content_seo_meta_tenant_fk.sql.
--
-- NOTHING CALLS THIS YET. provision-tenant still does its work over separate
-- round trips; wiring it to this function is a later change. Recording it now
-- means the repo describes the database even while the caller lags.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- WHAT IT IS. The S334 gate's core requirement: ONE Postgres function that
-- either commits all tenant state or none. Auth runs BEFORE it and outside it —
-- forced, not chosen, because profiles.id IS the auth user id and there is no
-- id to write until gotrue answers.
--
-- THE CONDITIONS IT ENCODES, each from the gate:
--   * payload_version is checked, so an old caller fails loudly (P6.1).
--   * the slug is REJECTED if non-canonical, never silently transformed (P6.2).
--   * a recorded vertical REQUIRES a non-empty service selection (P6.3) — the
--     emptiness rule is derived from the vertical rather than hardcoded.
--   * re-provision REFUSES service removal, and locks the tenant row FIRST so
--     two concurrent re-provisions cannot both pass the shrinkage check (P1).
--   * settings merge through public.merge_setting_value (S336), so an empty
--     overlay never blanks a real value.
--   * page_content is INSERT-MISSING-ONLY: the client owns their copy.
--   * seo_meta with user_edited=true is a HARD do-not-overwrite (B2).
--   * seo.service_areas is projected from PERSISTED rows, never the payload.
--   * outbound work is enqueued INSIDE the transaction (A2), with
--     ON CONFLICT DO NOTHING so a re-provision cannot mint a second vendor
--     create.
--
-- SECURITY DEFINER with SET search_path = '' and every object schema-qualified.
-- service_role EXECUTE only.

CREATE OR REPLACE FUNCTION public.provision_tenant_atomic(p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_mode        text := p_payload->>'mode';
  v_slug        text := p_payload->>'slug';
  v_tenant      uuid;
  v_user        uuid;
  v_ent         int;
  v_vertical    text;
  v_services    text[];
  v_existing    text[];
  v_removed     text[];
  v_cap         int;
  v_area_n      int;
  v_name        text;
  v_created     boolean := false;
  v_counts      jsonb := '{}'::jsonb;
  v_queued      text[] := ARRAY[]::text[];
  v_n           int;
  r             record;
BEGIN
  -- ── contract version (P6.1) ───────────────────────────────────────────────
  IF coalesce(p_payload->>'payload_version','') <> '1' THEN
    RAISE EXCEPTION 'provision: unsupported payload_version %', p_payload->>'payload_version'
      USING ERRCODE = '22023';
  END IF;

  -- ── identity + slug canonicalization: REJECT, never transform (P6.2) ──────
  IF v_mode NOT IN ('create','reprovision') THEN
    RAISE EXCEPTION 'provision: mode must be create|reprovision, got %', v_mode USING ERRCODE = '22023';
  END IF;
  IF v_slug IS NULL OR v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR length(v_slug) > 63 THEN
    RAISE EXCEPTION 'provision: slug % is not canonical', coalesce(v_slug,'(null)') USING ERRCODE = '22023';
  END IF;

  v_user := nullif(p_payload->>'auth_user_id','')::uuid;
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'provision: auth_user_id required (gotrue runs BEFORE this call)' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = v_user) THEN
    RAISE EXCEPTION 'provision: auth_user_id % does not exist', v_user USING ERRCODE = '22023';
  END IF;

  v_ent := nullif(p_payload->>'entitlement','')::int;
  IF v_ent IS NULL OR v_ent NOT BETWEEN 1 AND 4 THEN
    RAISE EXCEPTION 'provision: entitlement must be 1..4, got %', coalesce(p_payload->>'entitlement','(null)')
      USING ERRCODE = '22023';
  END IF;

  v_vertical := nullif(p_payload->>'vertical','');
  v_name     := coalesce(nullif(p_payload#>>'{business_info,name}',''), v_slug);

  -- ── services: explicit, deduped, canonical ────────────────────────────────
  SELECT coalesce(array_agg(s ORDER BY s), ARRAY[]::text[]) INTO v_services
  FROM jsonb_array_elements_text(coalesce(p_payload->'services','[]'::jsonb)) s;

  IF EXISTS (SELECT 1 FROM unnest(v_services) x GROUP BY x HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'provision: duplicate service slugs in payload' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM unnest(v_services) x WHERE x !~ '^[a-z0-9]+(-[a-z0-9]+)*$') THEN
    RAISE EXCEPTION 'provision: malformed service slug' USING ERRCODE = '22023';
  END IF;

  -- Emptiness rule DERIVED from the vertical (P6.3): a recorded vertical is
  -- service-based in this system; NULL means "not recorded" and seeds no service pages.
  IF v_vertical IS NOT NULL AND cardinality(v_services) = 0 THEN
    RAISE EXCEPTION 'provision: vertical % requires a non-empty service selection', v_vertical
      USING ERRCODE = '22023';
  END IF;

  -- ── tenant row. FIRST, because trg_enforce_location_cap reads entitlement ──
  IF v_mode = 'create' THEN
    IF EXISTS (SELECT 1 FROM public.tenants t WHERE t.slug = v_slug) THEN
      RAISE EXCEPTION 'provision: slug % already exists', v_slug USING ERRCODE = '23505';
    END IF;
    INSERT INTO public.tenants (slug, name, entitlement)
    VALUES (v_slug, v_name, v_ent)
    RETURNING id INTO v_tenant;
    v_created := true;
  ELSE
    v_tenant := nullif(p_payload->>'tenant_id','')::uuid;
    IF v_tenant IS NULL THEN
      RAISE EXCEPTION 'provision: reprovision requires tenant_id' USING ERRCODE = '22023';
    END IF;
    -- LOCK FIRST (P1). Without this two concurrent re-provisions both read the same
    -- service set, both pass the shrinkage check, and diverge.
    PERFORM 1 FROM public.tenants t WHERE t.id = v_tenant FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'provision: tenant % not found', v_tenant USING ERRCODE = '22023';
    END IF;
    -- tenant_id and slug must BOTH match. Never adopt a tenant found by slug alone.
    IF NOT EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = v_tenant AND t.slug = v_slug) THEN
      RAISE EXCEPTION 'provision: tenant_id % does not match slug %', v_tenant, v_slug USING ERRCODE = '22023';
    END IF;

    -- REJECT SHRINKAGE (gate condition A, unanimous).
    SELECT coalesce(array_agg(ts.service_slug ORDER BY ts.service_slug), ARRAY[]::text[])
      INTO v_existing
    FROM public.tenant_services ts WHERE ts.tenant_id = v_tenant;

    SELECT coalesce(array_agg(x ORDER BY x), ARRAY[]::text[]) INTO v_removed
    FROM unnest(v_existing) x WHERE NOT (x = ANY (v_services));

    IF cardinality(v_removed) > 0 THEN
      RAISE EXCEPTION
        'provision: service removal is not permitted during re-provision (removed: %). Use admin service management.',
        array_to_string(v_removed, ', ')
        USING ERRCODE = '22023';
    END IF;

    UPDATE public.tenants SET name = v_name, entitlement = v_ent WHERE id = v_tenant;
  END IF;

  -- ── membership. profiles.id IS the auth user id; both reference auth.users ──
  INSERT INTO public.tenant_users (tenant_id, user_id, role)
  VALUES (v_tenant, v_user, 'admin')
  ON CONFLICT (tenant_id, user_id) DO NOTHING;

  INSERT INTO public.profiles (id, tenant_id, full_name)
  VALUES (v_user, v_tenant, v_name || ' Admin')
  ON CONFLICT (id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id;

  -- ── settings, DB-side merge (S336). Empty overlay never blanks a real value ──
  v_n := 0;
  FOR r IN SELECT key, value FROM jsonb_each(coalesce(p_payload->'settings','{}'::jsonb)) LOOP
    INSERT INTO public.settings (tenant_id, key, value)
    VALUES (v_tenant, r.key, r.value)
    ON CONFLICT (tenant_id, key) DO UPDATE
      SET value = public.merge_setting_value(public.settings.value, EXCLUDED.value, public.settings.key);
    v_n := v_n + 1;
  END LOOP;
  v_counts := v_counts || jsonb_build_object('settings', v_n);

  -- ── the selection ─────────────────────────────────────────────────────────
  INSERT INTO public.tenant_services (tenant_id, service_slug)
  SELECT v_tenant, s FROM unnest(v_services) s
  ON CONFLICT (tenant_id, service_slug) DO NOTHING;
  v_counts := v_counts || jsonb_build_object('tenant_services', cardinality(v_services));

  -- ── page_content: INSERT-MISSING-ONLY, always. Client owns their copy. ────
  v_n := 0;
  FOR r IN SELECT * FROM jsonb_to_recordset(coalesce(p_payload->'page_content','[]'::jsonb))
           AS x(page_slug text, title text, subtitle text, intro text, hero_headline text) LOOP
    INSERT INTO public.page_content (tenant_id, page_slug, title, subtitle, intro, hero_headline)
    VALUES (v_tenant, r.page_slug, r.title, coalesce(r.subtitle,''), coalesce(r.intro,''), r.hero_headline)
    ON CONFLICT (tenant_id, page_slug) DO NOTHING;
    IF FOUND THEN v_n := v_n + 1; END IF;
  END LOOP;
  v_counts := v_counts || jsonb_build_object('page_content_inserted', v_n);

  -- ── service_areas. Cap validated HERE too (Gemini 5), not only by the trigger ──
  v_cap := CASE v_ent WHEN 1 THEN 3 WHEN 2 THEN 5 WHEN 3 THEN 10 ELSE NULL END;
  SELECT count(*) INTO v_area_n
  FROM jsonb_array_elements(coalesce(p_payload->'service_areas','[]'::jsonb));

  IF v_cap IS NOT NULL THEN
    DECLARE v_have int;
    BEGIN
      SELECT count(*) INTO v_have FROM public.service_areas sa WHERE sa.tenant_id = v_tenant;
      IF v_have + v_area_n > v_cap THEN
        RAISE EXCEPTION
          'provision: % service areas requested (% existing) exceeds the cap of % for entitlement %',
          v_area_n, v_have, v_cap, v_ent USING ERRCODE = '22023';
      END IF;
    END;
  END IF;

  v_n := 0;
  FOR r IN SELECT * FROM jsonb_to_recordset(coalesce(p_payload->'service_areas','[]'::jsonb))
           AS x(city text, slug text, state text, hero_title text,
                meta_title text, meta_description text, focus_keyword text) LOOP
    INSERT INTO public.service_areas
      (tenant_id, city, slug, state, hero_title, is_live, meta_title, meta_description, focus_keyword)
    VALUES (v_tenant, r.city, r.slug, r.state, r.hero_title, true,
            r.meta_title, r.meta_description, r.focus_keyword)
    ON CONFLICT (tenant_id, slug) DO NOTHING;
    IF FOUND THEN v_n := v_n + 1; END IF;
  END LOOP;
  v_counts := v_counts || jsonb_build_object('service_areas_inserted', v_n);

  -- ── seo_meta. user_edited=true is a HARD do-not-overwrite (B2). ───────────
  DECLARE v_ins int := 0; v_upd int := 0; v_kept int := 0;
  BEGIN
    FOR r IN SELECT * FROM jsonb_to_recordset(coalesce(p_payload->'seo_meta','[]'::jsonb))
             AS x(page_slug text, meta_title text, meta_description text, focus_keyword text) LOOP
      IF EXISTS (SELECT 1 FROM public.seo_meta m
                 WHERE m.tenant_id = v_tenant AND m.page_slug = r.page_slug AND m.user_edited) THEN
        v_kept := v_kept + 1;
        CONTINUE;
      END IF;
      INSERT INTO public.seo_meta (tenant_id, page_slug, meta_title, meta_description, focus_keyword, user_edited)
      VALUES (v_tenant, r.page_slug, r.meta_title, r.meta_description, r.focus_keyword, false)
      ON CONFLICT (tenant_id, page_slug) DO UPDATE
        SET meta_title = EXCLUDED.meta_title,
            meta_description = EXCLUDED.meta_description,
            focus_keyword = EXCLUDED.focus_keyword
        WHERE public.seo_meta.user_edited = false;
      IF FOUND THEN v_ins := v_ins + 1; ELSE v_upd := v_upd + 1; END IF;
    END LOOP;
    v_counts := v_counts || jsonb_build_object(
      'seo_meta_written', v_ins, 'seo_meta_skipped', v_upd,
      'seo_meta_preserved_user_edited', v_kept);
  END;

  -- ── seo.service_areas projection: from PERSISTED rows, never the payload (P6) ──
  DECLARE v_proj jsonb;
  BEGIN
    SELECT coalesce(jsonb_agg(sa.city ORDER BY sa.city), '[]'::jsonb) INTO v_proj
    FROM public.service_areas sa WHERE sa.tenant_id = v_tenant AND sa.is_live;

    INSERT INTO public.settings (tenant_id, key, value)
    VALUES (v_tenant, 'seo', jsonb_build_object('service_areas', v_proj))
    ON CONFLICT (tenant_id, key) DO UPDATE
      SET value = public.settings.value || jsonb_build_object('service_areas', v_proj);
  END;

  -- ── authority prompts: insert-if-missing, never re-enable a disabled prompt ──
  INSERT INTO public.ai_authority_prompts (tenant_id, prompt_text, active)
  SELECT v_tenant, p, true
  FROM jsonb_array_elements_text(coalesce(p_payload->'authority_prompts','[]'::jsonb)) p
  ON CONFLICT (tenant_id, prompt_text) DO NOTHING;
  v_counts := v_counts || jsonb_build_object(
    'authority_prompts', (SELECT count(*) FROM jsonb_array_elements_text(coalesce(p_payload->'authority_prompts','[]'::jsonb))));

  -- ── blog posts: insert-if-missing ─────────────────────────────────────────
  INSERT INTO public.blog_posts (tenant_id, title, slug, excerpt, content, published_at)
  SELECT v_tenant, b.title, b.slug, b.excerpt, b.content, b.published_at
  FROM jsonb_to_recordset(coalesce(p_payload->'blog_posts','[]'::jsonb))
       AS b(title text, slug text, excerpt text, content text, published_at timestamptz)
  ON CONFLICT (tenant_id, slug) DO NOTHING;

  -- ── onboarding session: create-only (P6.8) ────────────────────────────────
  IF v_mode = 'create' AND nullif(p_payload->>'onboarding_session_id','') IS NOT NULL THEN
    UPDATE public.onboarding_sessions
    SET consumed = true
    WHERE id = (p_payload->>'onboarding_session_id')::uuid AND consumed = false;
  END IF;

  -- ── prospect: CONDITIONAL, tenant-bound, never blind by UUID (P6.6) ───────
  IF nullif(p_payload->>'prospect_id','') IS NOT NULL THEN
    UPDATE public.prospects
    SET pipeline_stage = 'it_in_progress', tenant_id = v_tenant
    WHERE id = (p_payload->>'prospect_id')::uuid
      AND (tenant_id IS NULL OR tenant_id = v_tenant)
      AND coalesce(pipeline_stage,'') <> 'it_in_progress';
  END IF;

  -- ── outbound work, enqueued INSIDE the transaction (A2) ───────────────────
  -- ON CONFLICT DO NOTHING is the whole point: a re-provision must NEVER mint a second
  -- vendor-side create. Requeue is a separate, audited operator transition.
  IF coalesce((p_payload->>'queue_zernio')::boolean, false) THEN
    INSERT INTO public.outbound_integration_queue (tenant_id, kind, payload)
    VALUES (v_tenant, 'zernio_profile', jsonb_build_object('name', v_name, 'slug', v_slug))
    ON CONFLICT (tenant_id, kind) DO NOTHING;
    IF FOUND THEN v_queued := array_append(v_queued, 'zernio_profile'); END IF;
  END IF;
  IF coalesce((p_payload->>'queue_outscraper')::boolean, false) THEN
    INSERT INTO public.outbound_integration_queue (tenant_id, kind, payload)
    VALUES (v_tenant, 'outscraper_initial', jsonb_build_object('mode','initial'))
    ON CONFLICT (tenant_id, kind) DO NOTHING;
    IF FOUND THEN v_queued := array_append(v_queued, 'outscraper_initial'); END IF;
  END IF;

  RETURN jsonb_build_object(
    'tenant_id', v_tenant,
    'slug',      v_slug,
    'created',   v_created,
    'counts',    v_counts,
    'queued',    to_jsonb(v_queued)
  );
END;
$function$;

-- ── Grants ──────────────────────────────────────────────────────────────────
REVOKE ALL     ON FUNCTION public.provision_tenant_atomic(jsonb) FROM PUBLIC;
REVOKE ALL     ON FUNCTION public.provision_tenant_atomic(jsonb) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.provision_tenant_atomic(jsonb) TO service_role;

NOTIFY pgrst, 'reload schema';
