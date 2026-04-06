// Temporary migration runner — delete after use
// Uses postgres wire protocol to run DDL

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const DB_URL = Deno.env.get('SUPABASE_DB_URL') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

  if (!DB_URL) return json({ error: 'SUPABASE_DB_URL not set' }, 500)

  try {
    // @ts-ignore
    const { default: postgres } = await import('https://deno.land/x/postgresjs@v3.4.4/mod.js')
    const sql = postgres(DB_URL, { ssl: 'require' })

    await sql`
      CREATE TABLE IF NOT EXISTS faq_items (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id  UUID NOT NULL,
        question   TEXT NOT NULL,
        answer     TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `
    await sql`ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY`
    await sql`
      DO $$ BEGIN
        CREATE POLICY tenant_isolation ON faq_items
          USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1));
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `
    await sql`
      DO $$ BEGIN
        CREATE POLICY anon_read ON faq_items FOR SELECT TO anon USING (true);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `

    const TENANT = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'
    await sql`
      INSERT INTO faq_items (tenant_id, question, answer, sort_order) VALUES
        (${TENANT}, 'Are your treatments safe for pets and children?', 'Yes. All of our treatments use EPA-approved products and we follow all safety protocols. We''ll advise you on any re-entry times after treatment.', 0),
        (${TENANT}, 'How quickly can you get to my home?', 'We offer same-day and next-day service in most areas. Call us and we''ll do our best to schedule at a time that works for you.', 1),
        (${TENANT}, 'Do you offer a satisfaction guarantee?', 'Absolutely. If pests return between scheduled treatments, we''ll come back at no additional charge. Your satisfaction is our priority.', 2)
      ON CONFLICT DO NOTHING
    `
    await sql.end()
    return json({ success: true })
  } catch (err: any) {
    return json({ error: err.message || String(err) }, 500)
  }
})
