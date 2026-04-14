-- Allow Ironwood admin (users whose profile is in the demo/ironwood tenant) to
-- INSERT/UPDATE/DELETE any tenant's settings rows.
-- This lets Scott save integrations and other settings for client tenants from Ironwood Ops.
CREATE POLICY "ironwood_admin_settings_write"
  ON settings
  FOR ALL
  TO authenticated
  USING (
    current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'
  )
  WITH CHECK (
    current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'
  );
