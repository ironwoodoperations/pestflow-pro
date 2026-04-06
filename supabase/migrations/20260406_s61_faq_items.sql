-- S61: faq_items table for per-question FAQ management
CREATE TABLE IF NOT EXISTS faq_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL,
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

-- Tenant isolation: only authenticated users belonging to the tenant can read/write
CREATE POLICY "tenant_isolation" ON faq_items
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1));

-- Allow anon read so public FAQ page can fetch items
CREATE POLICY "anon_read" ON faq_items
  FOR SELECT TO anon USING (true);
