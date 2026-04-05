// Edge Function: ironwood-stripe-report
// JWT-verified. Returns Stripe subscription MRR summary for the Ironwood Ops Reports tab.

import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

  try {
    // Verify JWT
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '').trim()
    if (!token) return json({ error: 'Unauthorized' }, 401)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user || user.email !== 'admin@pestflowpro.com') {
      return json({ error: 'Forbidden' }, 403)
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) return json({ error: 'STRIPE_SECRET_KEY not configured' }, 500)

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' as any })

    // Start of current month (Unix timestamp)
    const now = new Date()
    const startOfMonth = Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000)

    // Active subscriptions
    const activeSubs = await stripe.subscriptions.list({ status: 'active', limit: 100 })
    let totalMRR = 0
    let newMRR = 0

    for (const sub of activeSubs.data) {
      const amount = sub.items.data.reduce((sum, item) => {
        return sum + ((item.price.unit_amount || 0) * (item.quantity || 1))
      }, 0) / 100
      totalMRR += amount
      if (sub.created >= startOfMonth) newMRR += amount
    }

    // Canceled this month
    const canceledSubs = await stripe.subscriptions.list({
      status: 'canceled',
      limit: 100,
      created: { gte: startOfMonth },
    })
    let churnedMRR = 0
    for (const sub of canceledSubs.data) {
      const amount = sub.items.data.reduce((sum, item) => {
        return sum + ((item.price.unit_amount || 0) * (item.quantity || 1))
      }, 0) / 100
      churnedMRR += amount
    }

    const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' })

    return json({
      totalMRR: Math.round(totalMRR),
      newMRR: Math.round(newMRR),
      churnedMRR: Math.round(churnedMRR),
      netChange: Math.round(newMRR - churnedMRR),
      activeCount: activeSubs.data.length,
      monthLabel,
    })
  } catch (err) {
    console.error('ironwood-stripe-report error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
})
