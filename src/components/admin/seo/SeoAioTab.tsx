import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../context/TenantBootProvider'

interface TrackedKeyword {
  keyword: string
  page_slug: string
}

interface GroupedPage {
  page_slug: string
  keywords: string[]
}

export default function SeoAioTab() {
  const { id: tenantId } = useTenant()
  const [state, setState] = useState<{
    groups: GroupedPage[]
    loading: boolean
    syncingSlug: string
    syncAllProgress: number
    syncAllTotal: number
  }>({ groups: [], loading: true, syncingSlug: '', syncAllProgress: 0, syncAllTotal: 0 })

  useEffect(() => {
    if (!tenantId) return
    supabase
      .from('keyword_tracker')
      .select('keyword, page_slug')
      .eq('tenant_id', tenantId)
      .then(({ data }) => {
        const map = new Map<string, string[]>()
        for (const row of (data || []) as TrackedKeyword[]) {
          const existing = map.get(row.page_slug) || []
          existing.push(row.keyword)
          map.set(row.page_slug, existing)
        }
        const groups: GroupedPage[] = Array.from(map.entries()).map(([page_slug, keywords]) => ({ page_slug, keywords }))
        groups.sort((a, b) => a.page_slug.localeCompare(b.page_slug))
        setState(prev => ({ ...prev, groups, loading: false }))
      })
  }, [tenantId])

  async function syncPage(page_slug: string, keywords: string[]) {
    if (!tenantId) return
    setState(prev => ({ ...prev, syncingSlug: page_slug }))

    const { data: existing } = await supabase
      .from('seo_meta')
      .select('meta_title, meta_description')
      .eq('tenant_id', tenantId)
      .eq('page_slug', page_slug)
      .maybeSingle()

    const currentTitle = existing?.meta_title || ''
    const currentDesc = existing?.meta_description || ''
    const topKeyword = keywords[0]

    const newTitle = currentTitle && !currentTitle.toLowerCase().includes(topKeyword.toLowerCase())
      ? `${currentTitle} | ${topKeyword}`
      : currentTitle || topKeyword

    const existingDescWords = currentDesc.toLowerCase()
    const missingKeywords = keywords.filter(kw => !existingDescWords.includes(kw.toLowerCase()))
    const newDesc = missingKeywords.length > 0 && currentDesc
      ? `${currentDesc} Keywords: ${missingKeywords.join(', ')}.`
      : currentDesc || `${keywords.join(', ')} — professional pest control in East Texas.`

    const { error } = await supabase.from('seo_meta').upsert({
      tenant_id: tenantId,
      page_slug,
      meta_title: newTitle.slice(0, 70),
      meta_description: newDesc.slice(0, 300),
    }, { onConflict: 'tenant_id,page_slug' })

    setState(prev => ({ ...prev, syncingSlug: '' }))
    if (error) toast.error(`Failed to sync ${page_slug}`)
    else toast.success(`Keywords synced to ${page_slug}`)
  }

  async function syncAll() {
    const total = state.groups.length
    setState(prev => ({ ...prev, syncAllTotal: total, syncAllProgress: 0 }))
    for (let i = 0; i < state.groups.length; i++) {
      const g = state.groups[i]
      await syncPage(g.page_slug, g.keywords)
      setState(prev => ({ ...prev, syncAllProgress: i + 1 }))
    }
    setState(prev => ({ ...prev, syncAllTotal: 0, syncAllProgress: 0 }))
    toast.success('All pages synced!')
  }

  if (state.loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <p className="text-gray-400 text-sm">Loading tracked keywords...</p>
      </div>
    )
  }

  if (state.groups.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center py-12">
        <p className="text-gray-500 mb-2">No tracked keywords found.</p>
        <p className="text-gray-400 text-sm">Use the AI Keyword Research tab to generate keywords and add them to the tracker first.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Bulk Keyword Sync</h3>
          <p className="text-gray-500 text-sm mt-1">Push tracked keywords into SEO meta fields for each page.</p>
        </div>
        <button
          onClick={syncAll}
          disabled={state.syncAllTotal > 0}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {state.syncAllTotal > 0
            ? `Syncing ${state.syncAllProgress}/${state.syncAllTotal}...`
            : 'Sync All Pages'}
        </button>
      </div>

      {state.syncAllTotal > 0 && (
        <div className="mb-4">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(state.syncAllProgress / state.syncAllTotal) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Page</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Keywords</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {state.groups.map(g => (
              <tr key={g.page_slug} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{g.page_slug}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {g.keywords.map(kw => (
                      <span key={kw} className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {kw}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => syncPage(g.page_slug, g.keywords)}
                    disabled={state.syncingSlug === g.page_slug}
                    className="text-emerald-600 hover:text-emerald-700 text-sm font-medium disabled:opacity-50"
                  >
                    {state.syncingSlug === g.page_slug ? 'Syncing...' : 'Sync to Page'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
