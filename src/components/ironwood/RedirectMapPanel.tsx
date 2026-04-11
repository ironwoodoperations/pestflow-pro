import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
import RedirectMapTable, { type RedirectRow, type MatchType } from './RedirectMapTable'

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

function buildVercelJson(rows: RedirectRow[]): string {
  const redirects = rows
    .filter(r => r.match_type !== 'exact' && r.old_url && r.new_url && r.old_url !== r.new_url)
    .map(r => ({ source: r.old_url, destination: r.new_url, permanent: true }))
  return JSON.stringify({ redirects }, null, 2)
}

export default function RedirectMapPanel({ prospectId, tenantId, redirectMap, redirectMapComplete, sourceUrl, onUpdated }: Props) {
  const [rows, setRows]           = useState<RedirectRow[]>(redirectMap)
  const [complete, setComplete]   = useState(redirectMapComplete)
  const [saving, setSaving]       = useState(false)
  const [savedAt, setSavedAt]     = useState<Date | null>(null)
  const [customRoutes, setCustomRoutes] = useState<string[]>([])
  const [copied, setCopied]       = useState(false)
  const [srcUrl, setSrcUrl]       = useState(sourceUrl || '')
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

  const vercelJson = buildVercelJson(rows)
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
