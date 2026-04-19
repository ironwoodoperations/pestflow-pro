import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
import RedirectMapTable, { type RedirectRow, type MatchType, STANDARD_ROUTES } from './RedirectMapTable'

interface Props {
  prospectId: string
  tenantId?: string | null
  redirectMap: RedirectRow[]
  redirectMapComplete: boolean
  sourceUrl?: string | null
  onUpdated: (patch: { redirect_map?: RedirectRow[]; redirect_map_complete?: boolean; source_url?: string }) => void
}

function parseCsvRows(text: string): RedirectRow[] {
  const lines = text.split(/\r?\n/)
  if (lines.length < 2) return []

  // Find header indices
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim())
  const idx = (name: string) => headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()))
  const addrIdx   = idx('Address')
  const statusIdx = idx('Status Code')
  const titleIdx  = idx('Title 1')
  const descIdx   = idx('Meta Description 1')

  if (addrIdx === -1) return []

  const rows: RedirectRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].match(/(".*?"|[^,]+|(?<=,)(?=,)|^(?=,)|(?<=,)$)/g) || []
    const clean = (s: string) => (s || '').replace(/^"|"$/g, '').trim()
    const addr = clean(cols[addrIdx] || '')
    const status = clean(cols[statusIdx] || '')
    if (!addr || status !== '200') continue

    // Strip domain, keep path only
    let slug = addr
    try { slug = new URL(addr.startsWith('http') ? addr : `https://example.com${addr}`).pathname } catch { /* keep as-is */ }
    if (!slug) slug = '/'

    const title = titleIdx >= 0 ? clean(cols[titleIdx] || '') : ''

    // Auto-suggest new_url
    const KNOWN = ['/', '/about', '/pest-control', '/termite-control', '/termite-inspections',
      '/mosquito-control', '/rodent-control', '/ant-control', '/spider-control',
      '/roach-control', '/bed-bug-control', '/flea-tick-control', '/wasp-hornet-control',
      '/scorpion-control', '/contact', '/quote', '/blog', '/faq', '/reviews', '/service-area']
    const matched = KNOWN.find(r => r === slug)
    const new_url = matched ?? '/'
    const match_type: MatchType = matched ? (matched === slug ? 'exact' : 'slug_change') : 'no_match'

    rows.push({
      id: crypto.randomUUID(),
      old_url: slug,
      new_url,
      match_type,
      has_backlinks: false,
      notes: '',
      page_title: title || descIdx >= 0 ? clean(cols[descIdx] || '') : '',
    })
  }
  return rows
}

function normalizePath(p: string): string {
  const s = p.trim()
  return s.startsWith('/') ? s : `/${s}`
}

function buildVercelJson(rows: RedirectRow[]): { json: string; skipped: number } {
  let skipped = 0
  const redirects = rows
    .filter(r => {
      if (!r.old_url || !r.new_url) return false
      const src = normalizePath(r.old_url)
      const dst = normalizePath(r.new_url)
      if (src === dst) { skipped++; return false }
      return true
    })
    .map(r => ({ source: normalizePath(r.old_url), destination: normalizePath(r.new_url), permanent: true }))
  return { json: JSON.stringify({ redirects }, null, 2), skipped }
}

export default function RedirectMapPanel({ prospectId, tenantId, redirectMap, redirectMapComplete, sourceUrl, onUpdated }: Props) {
  const [rows, setRows]           = useState<RedirectRow[]>(redirectMap)
  const [complete, setComplete]   = useState(redirectMapComplete)
  const [saving, setSaving]       = useState(false)
  const [savedAt, setSavedAt]     = useState<Date | null>(null)
  const [customRoutes, setCustomRoutes] = useState<string[]>([])
  const [copied, setCopied]       = useState(false)
  const [srcUrl, setSrcUrl]       = useState(sourceUrl || '')
  const [autoMapping, setAutoMapping] = useState(false)
  const [skippedDismissed, setSkippedDismissed] = useState(false)
  const saveTimer                 = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Load custom pages for this tenant
  useEffect(() => {
    if (!tenantId) return
    supabase.from('page_content').select('slug')
      .eq('tenant_id', tenantId)
      .then(({ data }) => {
        if (data) setCustomRoutes(data.map(p => `/${p.slug}`).filter(Boolean))
      })
  }, [tenantId])

  const persist = useCallback(async (nextRows: RedirectRow[]) => {
    setSaving(true)
    await supabase.from('prospects')
      .update({ redirect_map: nextRows, updated_at: new Date().toISOString() })
      .eq('id', prospectId)
    onUpdated({ redirect_map: nextRows })
    setSaving(false)
    setSavedAt(new Date())
  }, [prospectId, onUpdated])

  function handleRowsChange(nextRows: RedirectRow[]) {
    setRows(nextRows)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => persist(nextRows), 1000)
  }

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const parsed = parseCsvRows(text)
      if (parsed.length === 0) {
        toast.error('No valid rows found. Check the CSV has "Address" and "Status Code" columns.')
        return
      }
      toast.success(`Found ${parsed.length} pages — review and map each to its new URL`)
      handleRowsChange(parsed)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function markComplete() {
    if (rows.length < 3) return
    await supabase.from('prospects')
      .update({ redirect_map_complete: true, updated_at: new Date().toISOString() })
      .eq('id', prospectId)
    try {
      await supabase.from('prospect_activity').insert({
        prospect_id: prospectId,
        actor: 'ironwood',
        action: 'redirect_map_complete',
        detail: `301 redirect map marked complete — ${rows.length} redirects mapped`,
      })
    } catch { /* non-fatal */ }
    setComplete(true)
    onUpdated({ redirect_map_complete: true })
    toast.success('Redirect map marked complete')
  }

  async function saveSourceUrl(val: string) {
    await supabase.from('prospects').update({ source_url: val }).eq('id', prospectId)
    onUpdated({ source_url: val })
  }

  async function autoMap() {
    setAutoMapping(true)
    try {
      const oldUrls = rows.map(r => r.old_url)
      const availableRoutes = [...STANDARD_ROUTES, ...customRoutes.filter(r => !STANDARD_ROUTES.includes(r))]

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
          messages: [{
            role: 'user',
            content: `You are mapping old pest control website URLs to new URLs for a site migration.

Old URLs from existing site:
${oldUrls.join('\n')}

Available new site routes:
${availableRoutes.join('\n')}

Mapping rules (apply in order):
1. If old slug exactly matches a new route → use that route, type "exact"
2. Service pages (ant, termite, mosquito, rodent, spider, bed-bug, flea, wasp, roach, scorpion) → map to closest matching service route, type "slug_change"
3. Service area/city pages (city names, -tx suffix, service-area) → /locations, type "slug_change"
4. Blog posts (/blog/anything) → /blog, type "slug_change"
5. Quote/estimate pages → /get-quote, type "slug_change"
6. Reviews/testimonials → /about, type "slug_change"
7. Accessibility/legal/privacy → /, type "no_match"
8. Anything else with no clear match → /, type "no_match"

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {"old_url": "/ant-control/", "new_url": "/ant-control", "match_type": "exact"},
  {"old_url": "/lindale-tx/", "new_url": "/locations", "match_type": "slug_change"}
]`,
          }],
        }),
      })

      const data = await response.json()
      const text = data.content[0].text.trim()
      const clean = text.replace(/```json|```/g, '').trim()
      const mappings: Array<{ old_url: string; new_url: string; match_type: string }> = JSON.parse(clean)

      const byOldUrl = new Map(mappings.map(m => [m.old_url, m]))
      const updated = rows.map(r => {
        const m = byOldUrl.get(r.old_url)
        if (!m) return r
        return {
          ...r,
          new_url: m.new_url,
          match_type: (m.match_type as MatchType) || r.match_type,
        }
      })

      handleRowsChange(updated)
      toast.success(`✨ AI mapped ${mappings.length} URLs — review and adjust as needed`)
    } catch {
      toast.error('Auto-map failed — map manually')
    } finally {
      setAutoMapping(false)
    }
  }

  const { json: vercelJson, skipped: skippedCount } = useMemo(() => buildVercelJson(rows), [rows])
  const counts = {
    exact:  rows.filter(r => r.match_type === 'exact').length,
    slug:   rows.filter(r => r.match_type === 'slug_change').length,
    none:   rows.filter(r => r.match_type === 'no_match').length,
    links:  rows.filter(r => r.has_backlinks).length,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-200 border-b border-gray-700 pb-1 flex-1">
          301 Redirect Map
        </h3>
        {saving && <span className="text-xs text-gray-500 ml-3">Saving…</span>}
        {!saving && savedAt && <span className="text-xs text-emerald-500 ml-3">Saved ✓</span>}
      </div>
      <p className="text-xs text-gray-500">
        Upload a Screaming Frog CSV to map old URLs to new URLs before DNS cutover.
      </p>

      {/* Instructions */}
      <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-400 space-y-1">
        <p className="font-medium text-gray-300 mb-1.5">How to get the CSV:</p>
        <p>1. Download <span className="text-white">Screaming Frog SEO Spider</span> (free, Windows/Mac)</p>
        <p>2. Enter client's current site URL and crawl</p>
        <p>3. File → Export → All Inlinks → Save as CSV</p>
        <p>4. Upload the CSV below</p>
      </div>

      {/* Source URL */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Client's Current Site URL</label>
        <input
          value={srcUrl}
          onChange={e => setSrcUrl(e.target.value)}
          onBlur={e => saveSourceUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* CSV Upload */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">
          Upload Screaming Frog CSV Export
          {rows.length > 0 && <span className="text-gray-600 ml-2">Last import: {rows.length} URLs. Re-upload to replace.</span>}
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={handleCsvUpload}
          className="text-xs text-gray-400 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-gray-700 file:text-gray-200 hover:file:bg-gray-600 file:cursor-pointer"
        />
      </div>

      {/* Auto-Map button — shown when rows exist but mostly unmapped */}
      {rows.length > 0 && rows.filter(r => r.new_url === '/').length > 3 && (
        <div className="flex justify-end">
          <button
            onClick={autoMap}
            disabled={autoMapping}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs rounded-lg transition"
          >
            {autoMapping ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ✨ Mapping…
              </>
            ) : '✨ Auto-Map with AI'}
          </button>
        </div>
      )}

      {/* Redirect map table */}
      {rows.length > 0 && (
        <RedirectMapTable
          rows={rows}
          customRoutes={customRoutes}
          onChange={handleRowsChange}
        />
      )}

      {/* Counts */}
      {rows.length > 0 && (
        <div className="flex gap-3 flex-wrap text-xs">
          <span className="text-emerald-400">{counts.exact} exact</span>
          <span className="text-blue-400">{counts.slug} slug changes</span>
          <span className="text-amber-400">{counts.none} no-match</span>
          <span className="text-red-400">{counts.links} with backlinks</span>
        </div>
      )}

      {/* vercel.json output */}
      {rows.length > 0 && (
        <div>
          {skippedCount > 0 && !skippedDismissed && (
            <div className="flex items-center justify-between bg-amber-900/40 border border-amber-600/50 rounded px-3 py-2 mb-2">
              <span className="text-xs text-amber-300">
                ⚠ {skippedCount} redirect{skippedCount > 1 ? 's' : ''} skipped — source and destination were identical. These would cause redirect loops.
              </span>
              <button onClick={() => setSkippedDismissed(true)} className="text-amber-500 hover:text-amber-300 text-xs ml-3 leading-none">✕</button>
            </div>
          )}
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-400">Generated vercel.json redirects</label>
            <button
              onClick={() => { navigator.clipboard.writeText(vercelJson); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
              className="text-xs text-gray-400 hover:text-white transition px-2 py-0.5 bg-gray-800 rounded border border-gray-700"
            >
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
          <pre className="bg-gray-900 border border-gray-700 rounded p-3 text-xs text-gray-300 overflow-x-auto max-h-40 font-mono">
            {vercelJson}
          </pre>
          <p className="text-xs text-gray-600 mt-1">Paste into vercel.json in the repo then redeploy</p>
        </div>
      )}

      {/* Complete status */}
      <div className="flex items-center gap-3">
        {complete ? (
          <span className="text-xs text-emerald-400 font-medium">✓ Redirect map complete</span>
        ) : (
          <>
            <span className="text-xs text-amber-400 font-medium">⚠ Redirect map incomplete</span>
            <button
              onClick={markComplete}
              disabled={rows.length < 3}
              title={rows.length < 3 ? 'Add at least 3 rows first' : ''}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Mark Complete
            </button>
          </>
        )}
        {complete && (
          <button onClick={() => setComplete(false)}
            className="text-xs text-gray-500 hover:text-gray-300 transition underline">
            Edit
          </button>
        )}
      </div>
    </div>
  )
}
