import { createClient } from '@supabase/supabase-js'

const [,, email, password] = process.argv
if (!email || !password) {
  console.error('Usage: node scripts/create-admin-user.mjs email@example.com password')
  process.exit(1)
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const { data, error } = await supabase.auth.admin.createUser({
  email, password, email_confirm: true
})
if (error) { console.error('Auth error:', error.message); process.exit(1) }

const userId = data.user.id
const tenantId = crypto.randomUUID()

await supabase.from('profiles').insert({ id: userId, tenant_id: tenantId, full_name: 'Admin', role: 'admin' })
await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' })

const defaults = [
  { tenant_id: tenantId, key: 'business_info', value: { name: 'My Pest Control', phone: '', email, address: '', hours: 'Mon-Fri 8am-6pm', tagline: '', license: '' } },
  { tenant_id: tenantId, key: 'branding', value: { logo_url: '', favicon_url: '', primary_color: '#ff6a00', accent_color: '#f5c518', template: 'bold' } },
  { tenant_id: tenantId, key: 'onboarding_complete', value: { complete: false } },
]
await supabase.from('settings').insert(defaults)

console.log('✅ Admin created: ' + email)
console.log('   Tenant ID: ' + tenantId)
console.log('   Add to .env.local: VITE_TENANT_ID=' + tenantId)
