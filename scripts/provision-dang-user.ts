import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const DANG_TENANT_ID = '1611b16f-381b-4d4f-ba3a-fbde56ad425b'

  // 1. Create auth user
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: 'admin@dangpestcontrol.com',
    password: 'dang123',
    email_confirm: true,
  })
  if (userError) throw userError
  const userId = userData.user.id
  console.log('Auth user created:', userId)

  // 2. Upsert profile
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    tenant_id: DANG_TENANT_ID,
  })
  if (profileError) throw profileError
  console.log('Profile upserted')

  // 3. Insert tenant_users row — SSOT for membership + role, and the login gate
  //    in Login.tsx (S273: the dead `user_roles` write was removed here).
  const { error: tuError } = await supabase.from('tenant_users').insert({
    tenant_id: DANG_TENANT_ID,
    user_id: userId,
    role: 'admin',
  })
  if (tuError) throw tuError
  console.log('Tenant user inserted')

  console.log('Dang admin user provisioned successfully')
  console.log('User ID:', userId)
  console.log('Tenant ID:', DANG_TENANT_ID)
}

main().catch(console.error)
