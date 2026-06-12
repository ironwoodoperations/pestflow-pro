// Edge function: apply-finding-fix — S263 (Suggested-Fix Tier Layer / Report Fix-Chain).
//
// Single server-gated path for the report Fix-Chain. Three modes (default 'single'):
//   generate — Pro (tier 3): persist a generated suggested_fix on the finding +
//              stamp fix_base_updated_at (the target row's updated_at, read here).
//              Keeps ALL report_findings writes server-side (the table has no client
//              UPDATE RLS policy by design).
//   single   — Pro (tier 3): apply ONE finding's suggested_fix to its target column,
//              flip is_resolved. Tenant + optimistic-concurrency + user_edited guards
//              live in the UPDATE WHERE; 0 rows -> 409 (manual edit / stale preserved).
//   fix_all  — Elite (tier 4): the tier-4 gate runs FIRST, before enumerating; then a
//              server-side loop of the identical per-finding apply (each still tier-3
//              checked + WHERE-guarded). Non-atomic, no rollback.
//
// SEAMS (s263 spec §7): 1 the FRONTEND awaits this 200 then calls triggerRevalidate
// (this fn never purges ISR — Deno can't call Next revalidateTag). 2 tenant is the
// JWT-derived value from requireTenantAdmin, also pinned in every WHERE. 3 fix_field
// is mapped through a hardcoded enum→column table, never interpolated. 4 fix_all's
// own check_tenant_access(t,4) is first. 5 user_edited=false + updated_at in the WHERE.
//
// DEPLOY (verify_jwt:true — do NOT pass --no-verify-jwt):
//   supabase functions deploy apply-finding-fix --project-ref biezzykcgzkrwdgqpsar

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireTenantAdmin, AuthError } from '../_shared/auth/requireTenantUser.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const MAX_FIX_LEN = 2000

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// SEAM 3 — hardcoded enum→column map. The column written is a literal from this
// table, selected by lookup. fix_field is NEVER used as a dynamic SQL identifier.
const FIX_TARGETS = {
  intro:            { table: 'page_content', column: 'intro',            hasUserEdited: false },
  meta_title:       { table: 'seo_meta',     column: 'meta_title',       hasUserEdited: true  },
  meta_description: { table: 'seo_meta',     column: 'meta_description', hasUserEdited: true  },
  focus_keyword:    { table: 'seo_meta',     column: 'focus_keyword',    hasUserEdited: true  },
} as const
type FixField = keyof typeof FIX_TARGETS

type FindingRow = {
  id: string
  page_slug: string | null
  fix_field: string | null
  suggested_fix: string | null
  fix_base_updated_at: string | null
  is_resolved: boolean
}
type ApplyResult = {
  finding_id: string
  status: 'applied' | 'conflict' | 'forbidden' | 'invalid' | 'error'
  page_slug?: string | null
  reason?: string
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

async function tier3Ok(svc: SupabaseClient, tenant: string): Promise<boolean> {
  const { data, error } = await svc.rpc('check_tenant_access', { p_tenant_id: tenant, p_required_tier: 3 })
  return !error && data === true
}

// Load a finding strictly within the JWT-derived tenant (SEAM 2).
async function loadFinding(svc: SupabaseClient, tenant: string, id: string): Promise<FindingRow | null> {
  const { data } = await svc.from('report_findings')
    .select('id, page_slug, fix_field, suggested_fix, fix_base_updated_at, is_resolved')
    .eq('id', id).eq('tenant_id', tenant).maybeSingle()
  return (data as FindingRow) ?? null
}

// Apply ONE finding. Re-checks tier-3 (defense-in-depth in the fix_all loop too).
async function applyOne(svc: SupabaseClient, tenant: string, id: string): Promise<ApplyResult> {
  if (!(await tier3Ok(svc, tenant))) return { finding_id: id, status: 'forbidden', reason: 'upgrade_required' }

  const f = await loadFinding(svc, tenant, id)
  if (!f) return { finding_id: id, status: 'invalid', reason: 'not_found' }
  if (f.is_resolved) return { finding_id: id, status: 'invalid', reason: 'already_resolved' }
  if (!f.page_slug) return { finding_id: id, status: 'invalid', reason: 'not_page_scoped' }
  if (!f.suggested_fix) return { finding_id: id, status: 'invalid', reason: 'no_suggested_fix' }
  if (!f.fix_field || !(f.fix_field in FIX_TARGETS)) return { finding_id: id, status: 'invalid', reason: 'bad_fix_field' }
  // Concurrency baseline must exist (set at generate-time). Absent ⇒ regenerate.
  if (!f.fix_base_updated_at) return { finding_id: id, status: 'conflict', reason: 'stale_no_baseline' }

  const target = FIX_TARGETS[f.fix_field as FixField]
  const payload: Record<string, unknown> = { [target.column]: f.suggested_fix }
  if (target.hasUserEdited) payload.user_edited = true

  // SEAM 2 + 5 — tenant + page + optimistic-concurrency (+ user_edited for seo_meta)
  // all in the UPDATE predicate. UPDATE (not upsert): the guards gate atomically.
  let q = svc.from(target.table).update(payload)
    .eq('tenant_id', tenant).eq('page_slug', f.page_slug).eq('updated_at', f.fix_base_updated_at)
  if (target.hasUserEdited) q = q.eq('user_edited', false)
  const { data: rows, error: wErr } = await q.select('id')
  if (wErr) { console.error('[apply-finding-fix] write error:', wErr.message); return { finding_id: id, status: 'error', reason: 'write_failed' } }
  if (!rows || rows.length === 0) return { finding_id: id, status: 'conflict', reason: 'manual_edit_or_stale', page_slug: f.page_slug }

  const { error: rErr } = await svc.from('report_findings')
    .update({ is_resolved: true }).eq('id', id).eq('tenant_id', tenant)
  if (rErr) { console.error('[apply-finding-fix] resolve flip error:', rErr.message); return { finding_id: id, status: 'error', reason: 'resolve_failed', page_slug: f.page_slug } }

  return { finding_id: id, status: 'applied', page_slug: f.page_slug }
}

// mode='generate' — persist a generated suggested_fix + stamp the concurrency baseline.
async function handleGenerate(svc: SupabaseClient, tenant: string, id: string, suggestedFix: unknown): Promise<Response> {
  if (typeof suggestedFix !== 'string' || !suggestedFix.trim()) return json(400, { error: 'suggested_fix required' })
  if (suggestedFix.length > MAX_FIX_LEN) return json(400, { error: `suggested_fix exceeds ${MAX_FIX_LEN} chars` })

  const f = await loadFinding(svc, tenant, id)
  if (!f) return json(404, { error: 'not_found' })
  if (!f.page_slug) return json(400, { error: 'not_page_scoped' })
  if (!f.fix_field || !(f.fix_field in FIX_TARGETS)) return json(400, { error: 'bad_fix_field' })

  // Read the target row's current updated_at — the authoritative concurrency baseline.
  const target = FIX_TARGETS[f.fix_field as FixField]
  const { data: tgt } = await svc.from(target.table).select('updated_at')
    .eq('tenant_id', tenant).eq('page_slug', f.page_slug).maybeSingle()
  const baseline = (tgt as { updated_at?: string } | null)?.updated_at ?? null

  const { error } = await svc.from('report_findings')
    .update({ suggested_fix: suggestedFix, suggested_fix_at: new Date().toISOString(), fix_base_updated_at: baseline })
    .eq('id', id).eq('tenant_id', tenant)
  if (error) { console.error('[apply-finding-fix] generate persist error:', error.message); return json(500, { error: 'persist_failed' }) }

  return json(200, { ok: true, finding_id: id, fix_field: f.fix_field, page_slug: f.page_slug, suggested_fix: suggestedFix })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json(400, { error: 'Invalid JSON' }) }

  const mode = typeof body.mode === 'string' ? body.mode : 'single'
  const tenantArg = typeof body.tenant_id === 'string' ? body.tenant_id : ''
  if (!tenantArg) return json(400, { error: 'tenant_id required' })

  // SEAM 2 — requireTenantAdmin returns the profile-derived tenant; it 403s unless
  // the caller is an admin of tenantArg. Use the RETURNED value as authoritative.
  let tenant: string
  try {
    const res = await requireTenantAdmin(req, tenantArg)
    tenant = res.tenantId
  } catch (e) {
    if (e instanceof AuthError) return e.toResponse()
    console.error('[apply-finding-fix] auth error:', (e as Error)?.message)
    return json(500, { error: 'auth_failed' })
  }

  const svc = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  // ── mode: generate (Pro) ──
  if (mode === 'generate') {
    if (!(await tier3Ok(svc, tenant))) return json(403, { error: 'upgrade_required' })
    const id = typeof body.finding_id === 'string' ? body.finding_id : ''
    if (!id) return json(400, { error: 'finding_id required' })
    return await handleGenerate(svc, tenant, id, body.suggested_fix)
  }

  // ── mode: fix_all (Elite) — SEAM 4: tier-4 gate FIRST, before enumerate/loop ──
  if (mode === 'fix_all') {
    const { data: elite, error: gErr } = await svc.rpc('check_tenant_access', { p_tenant_id: tenant, p_required_tier: 4 })
    if (gErr || elite !== true) return json(403, { error: 'upgrade_required' })

    const { data: findings, error: eErr } = await svc.from('report_findings')
      .select('id').eq('tenant_id', tenant).eq('is_resolved', false)
      .not('page_slug', 'is', null).not('fix_field', 'is', null).not('suggested_fix', 'is', null)
    if (eErr) { console.error('[apply-finding-fix] enumerate error:', eErr.message); return json(500, { error: 'enumerate_failed' }) }

    const results: ApplyResult[] = []
    for (const row of findings ?? []) results.push(await applyOne(svc, tenant, (row as { id: string }).id))
    const slugs = [...new Set(results.filter(r => r.status === 'applied').map(r => r.page_slug).filter(Boolean))]
    return json(200, { ok: true, mode: 'fix_all', results, slugs })
  }

  // ── mode: single (Pro) ──
  const id = typeof body.finding_id === 'string' ? body.finding_id : ''
  if (!id) return json(400, { error: 'finding_id required' })
  const r = await applyOne(svc, tenant, id)
  const statusCode = r.status === 'applied' ? 200
    : r.status === 'conflict' ? 409
    : r.status === 'forbidden' ? 403
    : r.status === 'invalid' ? (r.reason === 'not_found' ? 404 : 400)
    : 500
  return json(statusCode, r.status === 'applied' ? { ok: true, ...r } : { error: r.reason, ...r })
})
