// Temporary migration runner — delete after use
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const DB_URL = Deno.env.get('SUPABASE_DB_URL') || ''

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

  if (!DB_URL) return json({ error: 'SUPABASE_DB_URL not set' }, 500)

  try {
    // @ts-ignore
    const { default: postgres } = await import('https://deno.land/x/postgresjs@v3.4.4/mod.js')
    const sql = postgres(DB_URL, { ssl: 'require' })

    // S163 T5a: JSONB array column DDL removed — dropped in Part B migration
    await sql.end()
    return json({ success: true })
  } catch (err: any) {
    return json({ error: err.message || String(err) }, 500)
  }
})
