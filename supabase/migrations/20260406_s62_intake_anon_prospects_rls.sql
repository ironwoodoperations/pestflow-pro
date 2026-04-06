-- S62 hotfix: allow anon to read prospect rows that have an active intake_token
-- This is required for IntakePage to pre-fill form data from prospect record.
-- Scoped to prospects with a non-submitted, non-expired intake_token — anon
-- cannot read arbitrary prospect rows.
CREATE POLICY "anon_read_for_intake" ON public.prospects
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.intake_tokens t
      WHERE t.prospect_id = prospects.id
        AND t.submitted_at IS NULL
        AND t.expires_at > now()
    )
  );
