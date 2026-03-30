/**
 * Create Demo Tenant #2 — Lone Star Pest Control
 *
 * This script seeds a second tenant to demonstrate white-label isolation.
 * It does NOT create a user or auth — use create-admin-user.mjs for that.
 *
 * USAGE:
 *   SUPABASE_URL=https://biezzykcgzkrwdgqpsar.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
 *   node scripts/create-demo-tenant.mjs
 *
 * HOW TENANT ISOLATION WORKS:
 *   - Each tenant has a UUID stored in the `tenants` table
 *   - The frontend resolves tenant_id via:
 *     1. localStorage 'pf_tenant_id' (set during onboarding or login)
 *     2. Fallback: VITE_TENANT_ID env var (demo mode)
 *   - Every Supabase query filters by tenant_id
 *   - RLS policies enforce tenant isolation at the database level
 *   - To switch tenants: set VITE_TENANT_ID in .env or use setTenantId() from src/lib/tenant.ts
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const TENANT_ID = randomUUID()

// 1. Create tenant record
const { error: tenantError } = await supabase.from('tenants').insert({
  id: TENANT_ID,
  name: 'Lone Star Pest Control',
  slug: 'lonestar',
})
if (tenantError) console.warn('Tenant insert:', tenantError.message)

// 2. Seed settings
const settings = [
  {
    tenant_id: TENANT_ID, key: 'business_info',
    value: {
      name: 'Lone Star Pest Control',
      phone: '(903) 555-0199',
      email: 'info@lonestarpest.com',
      address: '456 Ranch Rd, Longview TX 75601',
      tagline: 'East Texas Pest Experts',
      license: 'TPCL-99999',
      hours: 'Mon-Fri 7am-5pm',
    },
  },
  {
    tenant_id: TENANT_ID, key: 'branding',
    value: {
      primary_color: '#10b981',
      accent_color: '#f5c518',
      template: 'bold',
    },
  },
  {
    tenant_id: TENANT_ID, key: 'onboarding_complete',
    value: { complete: true },
  },
]

for (const row of settings) {
  const { error } = await supabase.from('settings').upsert(row, { onConflict: 'tenant_id,key' })
  if (error) console.warn(`Settings ${row.key}:`, error.message)
}

// 3. Seed a location
await supabase.from('location_data').insert({
  tenant_id: TENANT_ID, city: 'Longview', slug: 'longview-tx',
  hero_title: 'Longview Pest Control', is_live: true,
})

console.log('✅ Demo tenant 2 seeded successfully!')
console.log('   Tenant ID:', TENANT_ID)
console.log('   Business: Lone Star Pest Control')
console.log('')
console.log('To use this tenant, set VITE_TENANT_ID=' + TENANT_ID + ' in your .env file')
