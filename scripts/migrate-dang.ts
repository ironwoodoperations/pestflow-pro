import { createClient } from '@supabase/supabase-js'

const dang = createClient(
  process.env.DANG_SUPABASE_URL!,
  process.env.DANG_SUPABASE_ANON_KEY!
)

const pro = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const OLD_TENANT_ID = '1282b822-825b-4713-9dc9-6d14a2094d06'
const NEW_TENANT_ID = '1611b16f-381b-4d4f-ba3a-fbde56ad425b'

async function migrate(
  table: string,
  extraStrip: string[] = [],
  transform?: (row: any) => any
): Promise<number> {
  const { data, error } = await dang
    .from(table)
    .select('*')
    .eq('tenant_id', OLD_TENANT_ID)

  if (error) {
    console.error(`Error reading ${table}:`, error.message)
    return 0
  }
  if (!data || data.length === 0) {
    console.log(`${table}: 0 rows`)
    return 0
  }

  const cleaned = data.map((row: any) => {
    let r = { ...row }
    delete r.id
    r.tenant_id = NEW_TENANT_ID
    extraStrip.forEach(k => delete r[k])
    if (transform) r = transform(r)
    return r
  })

  const { error: insertError } = await pro.from(table).insert(cleaned)
  if (insertError) {
    console.error(`Error inserting into ${table}:`, insertError.message)
    return 0
  }
  console.log(`${table}: migrated ${cleaned.length} rows`)
  return cleaned.length
}

async function main() {
  console.log('Starting Dang migration...')
  console.log(`OLD: ${OLD_TENANT_ID}`)
  console.log(`NEW: ${NEW_TENANT_ID}`)

  await migrate('settings')
  await migrate('leads')
  await migrate('social_posts')
  await migrate('blog_posts')
  await migrate('keywords')
  await migrate('testimonials')

  // locations — try both table names
  const locCount = await migrate('locations')
  if (locCount === 0) await migrate('location_data')

  await migrate('page_content', ['custom_content'], (row) => {
    // Dang uses 'slug'; PestFlow Pro uses 'page_slug'
    if (row.slug !== undefined) { row.page_slug = row.slug; delete row.slug }
    return row
  })

  console.log('Migration complete.')
}

main().catch(console.error)
