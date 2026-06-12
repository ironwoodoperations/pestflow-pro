import { useState } from 'react'
import { toast } from 'sonner'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase'
import { triggerRevalidate } from '../../../lib/revalidate'
import { callAi } from '../../../lib/ai/callAi'
import type { FixField, PageFinding, SeoPageRow } from './seoTypes'

// S263 — Report Fix-Chain client logic: per-finding Generate (Pro) + Apply (Pro) and
// Elite Fix-all. ALL gates are enforced server-side by apply-finding-fix / ai-proxy;
// this hook is the cosmetic driver. SEAM 1: every apply AWAITS the edge 200, THEN
// calls triggerRevalidate sequentially (never before, never fire-and-forget).

type Status = 'applied' | 'conflict' | 'error'

// Per-fix_field generation prompt. Plain text out (no JSON) — trimmed + de-quoted.
function buildPrompt(fixField: FixField, business: string, city: string, pageLabel: string) {
  const ctx = `Business: ${business}. City: ${city}. Page: ${pageLabel}.`
  switch (fixField) {
    case 'intro':
      return { system: 'You write concise, trustworthy website copy for pest-control companies. Output PLAIN TEXT only — no markdown, no quotes, no preamble.', user: `${ctx}\nWrite a 2–4 sentence intro paragraph for this page describing the service in a warm, local, professional tone.` }
    case 'meta_title':
      return { system: 'You are an SEO specialist for pest-control websites. Output PLAIN TEXT only — no quotes, no markdown, just the title.', user: `${ctx}\nWrite an SEO meta title of 50–60 characters. Include the city and the main keyword.` }
    case 'meta_description':
      return { system: 'You are an SEO specialist for pest-control websites. Output PLAIN TEXT only — no quotes, no markdown, just the description.', user: `${ctx}\nWrite an SEO meta description of 70–160 characters with a clear call to action.` }
    case 'focus_keyword':
      return { system: 'You are an SEO specialist for pest-control websites. Output PLAIN TEXT only — just the phrase, no quotes.', user: `${ctx}\nGive a single 2–4 word focus keyword phrase this page should rank for.` }
  }
}

const clean = (t: string) => t.replace(/```[a-z]*|```/gi, '').replace(/^["'\s]+|["'\s]+$/g, '').trim()

async function edgeError(error: unknown): Promise<{ status: number; reason: string }> {
  if (error instanceof FunctionsHttpError) {
    const status = error.context?.status ?? 0
    let reason = ''
    try { reason = (await error.context.json())?.error ?? '' } catch { /* ignore */ }
    return { status, reason }
  }
  return { status: 0, reason: (error as Error)?.message ?? 'unknown' }
}

export function useSeoFixChain(tenantId: string, pages: SeoPageRow[], reload: () => Promise<void> | void) {
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [fixAllRunning, setFixAllRunning] = useState(false)
  const [fixAllOpen, setFixAllOpen] = useState(false)
  const [suggestedOverride, setSuggestedOverride] = useState<Record<string, string>>({})
  const [findingStatus, setFindingStatus] = useState<Record<string, Status>>({})

  const token = async () => (await supabase.auth.getSession()).data.session?.access_token ?? null

  const handleGenerateFix = async (finding: PageFinding, pageLabel: string) => {
    if (!tenantId || !finding.fixField) return
    setGeneratingId(finding.id)
    try {
      const bizRes = await supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle()
      const biz = (bizRes.data?.value ?? {}) as { name?: string; address?: string; city?: string }
      const { system, user } = buildPrompt(finding.fixField, biz.name || 'this company', biz.city || biz.address || 'your area', pageLabel)
      const json = await callAi('seo_fix', { tenant_id: tenantId, max_tokens: 400, system, messages: [{ role: 'user', content: user }] })
      const text = clean(json.content?.[0]?.text || '')
      if (!text) { toast.error('AI returned an empty fix. Try again.'); return }
      // Persist server-side (table has no client UPDATE policy) — also stamps the
      // optimistic-concurrency baseline. Pro tier re-checked on the edge.
      const { error } = await supabase.functions.invoke('apply-finding-fix', {
        body: { mode: 'generate', tenant_id: tenantId, finding_id: finding.id, suggested_fix: text },
      })
      if (error) { const e = await edgeError(error); toast.error(e.status === 403 ? 'Generating fixes needs the Pro plan.' : 'Could not save the suggested fix.'); return }
      setSuggestedOverride(prev => ({ ...prev, [finding.id]: text }))
    } catch (err) {
      toast.error((err as Error)?.message || 'AI generation failed. Please try again.')
    } finally {
      setGeneratingId(null)
    }
  }

  // SEAM 1 — await the edge 200, THEN revalidate. Returns the applied page slug.
  const applyOne = async (findingId: string, slug: string): Promise<Status> => {
    const { data, error } = await supabase.functions.invoke('apply-finding-fix', {
      body: { mode: 'single', tenant_id: tenantId, finding_id: findingId },
    })
    if (error) {
      const e = await edgeError(error)
      if (e.status === 409) return 'conflict'
      if (e.status === 403) { toast.error('Applying fixes needs the Pro plan.'); return 'error' }
      return 'error'
    }
    const appliedSlug = (data as { page_slug?: string })?.page_slug || slug
    const t = await token()
    if (t) await triggerRevalidate({ type: 'page', tenantId, slug: appliedSlug }, t)
    return 'applied'
  }

  const handleApplyFix = async (finding: PageFinding, slug: string) => {
    if (!tenantId) return
    setApplyingId(finding.id)
    try {
      const status = await applyOne(finding.id, slug)
      setFindingStatus(prev => ({ ...prev, [finding.id]: status }))
      if (status === 'applied') { toast.success('Fix applied and your live site refreshed.'); await reload() }
      else if (status === 'conflict') toast.info('Your manual edit was kept — regenerate to refresh the suggestion.')
      else toast.error('Could not apply the fix.')
    } finally {
      setApplyingId(null)
    }
  }

  const handleFixAll = async () => {
    if (!tenantId) return
    setFixAllRunning(true)
    try {
      const { data, error } = await supabase.functions.invoke('apply-finding-fix', {
        body: { mode: 'fix_all', tenant_id: tenantId },
      })
      if (error) { const e = await edgeError(error); toast.error(e.status === 403 ? 'Fix all is an Elite feature.' : 'Fix all failed.'); return }
      const results = (data as { results?: { status: Status }[]; slugs?: string[] }) || {}
      const applied = (results.results ?? []).filter(r => r.status === 'applied').length
      const conflicts = (results.results ?? []).filter(r => r.status === 'conflict').length
      // SEAM 1 — revalidate each distinct written slug AFTER the writes returned.
      const t = await token()
      if (t) for (const slug of results.slugs ?? []) await triggerRevalidate({ type: 'page', tenantId, slug }, t)
      toast.success(`Applied ${applied} fix${applied === 1 ? '' : 'es'}${conflicts ? `, kept ${conflicts} manual edit${conflicts === 1 ? '' : 's'}` : ''}.`)
      setFixAllOpen(false)
      await reload()
    } finally {
      setFixAllRunning(false)
    }
  }

  // Findings eligible for a one-click apply across all pages (Elite Fix-all preview).
  const applyableFindings = pages.flatMap(p => (p.findings ?? [])
    .filter(f => f.applyable)
    .map(f => ({ pageLabel: p.label, slug: p.slug, finding: f })))

  return {
    generatingId, applyingId, fixAllRunning, fixAllOpen,
    suggestedOverride, findingStatus, applyableFindings,
    openFixAll: () => setFixAllOpen(true), closeFixAll: () => setFixAllOpen(false),
    handleGenerateFix, handleApplyFix, handleFixAll,
  }
}

export type SeoFixChain = ReturnType<typeof useSeoFixChain>

