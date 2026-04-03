/**
 * Seed demo social_campaigns for PestFlow Pro.
 *
 * USAGE:
 *   SUPABASE_URL=https://biezzykcgzkrwdgqpsar.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=your-key \
 *   TENANT_ID=9215b06b-3eb5-49a1-a16e-7ff214bf6783 \
 *   node scripts/seed-campaigns.mjs
 *
 * NOTE: Requires the social_campaigns table to exist.
 * If it does not, create it first:
 *   CREATE TABLE public.social_campaigns (
 *     id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
 *     tenant_id uuid NOT NULL,
 *     title text NOT NULL,
 *     goal text,
 *     tone text DEFAULT 'casual',
 *     duration_days integer DEFAULT 7,
 *     platforms text[] DEFAULT '{}',
 *     start_date date,
 *     status text DEFAULT 'active',
 *     created_at timestamptz DEFAULT now()
 *   );
 *   ALTER TABLE public.social_campaigns ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "tenant_access_social_campaigns" ON public.social_campaigns
 *     FOR ALL USING (auth.role() = 'authenticated');
 *   CREATE POLICY "anon_read_social_campaigns" ON public.social_campaigns
 *     FOR SELECT TO anon USING (true);
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const TENANT_ID = process.env.TENANT_ID || '9215b06b-3eb5-49a1-a16e-7ff214bf6783'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const campaigns = [
  {
    tenant_id: TENANT_ID,
    title: 'Spring Termite Season',
    goal: 'Promote termite inspections and treatments during peak season',
    tone: 'urgent',
    duration_days: 30,
    platforms: ['facebook', 'instagram'],
    start_date: '2026-04-01',
    status: 'active',
  },
  {
    tenant_id: TENANT_ID,
    title: 'Monthly Maintenance Push',
    goal: 'Remind existing customers about recurring pest control plans',
    tone: 'friendly',
    duration_days: 14,
    platforms: ['facebook'],
    start_date: '2026-04-15',
    status: 'active',
  },
]

for (const campaign of campaigns) {
  const { data, error } = await supabase
    .from('social_campaigns')
    .upsert(campaign, { onConflict: 'tenant_id,title' })
    .select()
  if (error) console.error('Error:', error.message)
  else console.log('Seeded campaign:', data?.[0]?.title || 'unknown')
}

const { count } = await supabase
  .from('social_campaigns')
  .select('*', { count: 'exact', head: true })
  .eq('tenant_id', TENANT_ID)

console.log('Total campaigns for tenant:', count)
