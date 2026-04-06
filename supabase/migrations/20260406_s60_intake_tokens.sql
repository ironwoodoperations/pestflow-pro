-- S60: intake_tokens table + prospects intake columns
CREATE TABLE IF NOT EXISTS intake_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id   UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  token         TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  submitted_at  TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE intake_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON intake_tokens USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_by_token" ON intake_tokens FOR SELECT TO anon USING (true);
CREATE POLICY "anon_submit" ON intake_tokens FOR UPDATE TO anon USING (true) WITH CHECK (true);

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS intake_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS intake_data JSONB;
