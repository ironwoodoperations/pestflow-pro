-- ============================================================
-- s215_migration_4a_intake_secdef
--
-- Replace 4 wide-open anon RLS policies with 2 SECURITY DEFINER RPCs.
-- Server-controlled column scope: submit_intake writes ONLY to the
-- 7 known intake columns; unknown payload keys are ignored.
-- Atomic per S212.1: applied via Claude.ai MCP after PR merges +
-- Vercel production deploy is green.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_intake_by_token(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'prospect_id',   p.id,
    'company_name',  p.company_name,
    'contact_name',  p.contact_name,
    'email',         p.email,
    'phone',         p.phone,
    'website_url',   p.website_url,
    'business_info', p.business_info,
    'branding',      p.branding,
    'intake_data',   p.intake_data,
    'tier',          p.tier,
    'build_path',    p.build_path,
    'expires_at',    t.expires_at,
    'is_expired',    (t.expires_at < now()),
    'is_submitted',  (t.submitted_at IS NOT NULL)
  ) INTO v_result
  FROM public.intake_tokens t
  JOIN public.prospects p ON p.id = t.prospect_id
  WHERE t.token = p_token;

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_intake_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_intake_by_token(text) TO anon;

CREATE OR REPLACE FUNCTION public.submit_intake(p_token text, p_payload jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
DECLARE
  v_prospect_id uuid;
BEGIN
  -- Validate token + lock the row to prevent race on double-submit
  SELECT prospect_id INTO v_prospect_id
  FROM public.intake_tokens
  WHERE token = p_token
    AND submitted_at IS NULL
    AND expires_at > now()
  FOR UPDATE;

  IF v_prospect_id IS NULL THEN
    RAISE EXCEPTION 'invalid_or_expired_token'
      USING ERRCODE = 'P0001';
  END IF;

  -- intake_data is required (the form payload itself)
  IF (p_payload->'intake_data') IS NULL THEN
    RAISE EXCEPTION 'missing_intake_data'
      USING ERRCODE = 'P0001';
  END IF;

  -- Mark token submitted
  UPDATE public.intake_tokens
  SET submitted_at = now()
  WHERE token = p_token;

  -- Atomic: server-controlled column scope. Only these 7 columns can be
  -- touched. COALESCE preserves existing values when payload key is absent
  -- or jsonb null — the frontend must include a field in the payload for it
  -- to be overwritten. intake_data is written directly (validated above).
  UPDATE public.prospects
  SET
    phone               = COALESCE(p_payload->>'phone', phone),
    email               = COALESCE(p_payload->>'email', email),
    business_info       = COALESCE(p_payload->'business_info', business_info),
    branding            = COALESCE(p_payload->'branding', branding),
    website_url         = COALESCE(p_payload->>'website_url', website_url),
    intake_data         = p_payload->'intake_data',
    intake_submitted_at = now()
  WHERE id = v_prospect_id;

  RETURN json_build_object(
    'success', true,
    'prospect_id', v_prospect_id
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_intake(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_intake(text, jsonb) TO anon;

DROP POLICY IF EXISTS anon_read_by_token ON public.intake_tokens;
DROP POLICY IF EXISTS anon_submit ON public.intake_tokens;
DROP POLICY IF EXISTS anon_read_for_intake ON public.prospects;
DROP POLICY IF EXISTS anon_update_for_intake ON public.prospects;

NOTIFY pgrst, 'reload schema';
