import React, { useState } from 'react'
import type { SeoPageRow, SeoStats, EditorForm } from './seoTypes'
import SeoStatCards from './SeoStatCards'

interface Props {
  stats: SeoStats
  pages: SeoPageRow[]
  openEditorSlug: string | null
  editorForm: EditorForm
  editorSaving: boolean
  onOpenEditor: (slug: string) => void
  onCloseEditor: () => void
  onEditorChange: (field: keyof EditorForm, value: string) => void
  onSaveMeta: (slug: string) => void
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  pest:     { label: 'Pest',     color: 'bg-green-100 text-green-700' },
  location: { label: 'Location', color: 'bg-blue-100 text-blue-700' },
  blog:     { label: 'Blog',     color: 'bg-purple-100 text-purple-700' },
  static:   { label: 'Static',   color: 'bg-gray-100 text-gray-600' },
}

function CharCount({ value, max }: { value: string; max: number }) {
  const len = value.length
  const color = len > max ? 'text-red-500' : len > max - 10 ? 'text-amber-500' : 'text-gray-400'
  return <span className={`text-xs ${color}`}>{len}/{max}</span>
}

export default function SeoPagesTab({
  stats, pages, openEditorSlug, editorForm,
  editorSaving, onOpenEditor, onCloseEditor, onEditorChange, onSaveMeta
}: Props) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [seoFilter, setSeoFilter] = useState('all')

  const filtered = pages.filter(p => {
    if (search && !p.label.toLowerCase().includes(search.toLowerCase()) &&
        !p.url.toLowerCase().includes(search.toLowerCase())) return false
    if (typeFilter !== 'all' && p.type !== typeFilter) return false
    if (statusFilter === 'live' && !p.isLive) return false
    if (statusFilter === 'draft' && p.isLive) return false
    if (seoFilter === 'missing' && p.hasMeta) return false
    if (seoFilter === 'configured' && !p.hasMeta) return false
    return true
  })

  const inputCls = 'border border-gray-200 rounded-lg px-3 py-1.5 text-sm'

  return (
    <div className="space-y-4">
      <SeoStatCards stats={stats} />

      {stats.issuesFound > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-amber-800">
            ⚠️ {stats.issuesFound} live {stats.issuesFound === 1 ? 'page is' : 'pages are'} missing SEO metadata
          </span>
          <button onClick={() => { setStatusFilter('live'); setSeoFilter('missing') }}
            className="text-xs text-amber-700 font-semibold hover:underline">Show missing →</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search pages…" className={`${inputCls} flex-1 min-w-40`} />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={`${inputCls} bg-white`}>
          <option value="all">All Types</option>
          <option value="pest">Pest Pages</option>
          <option value="location">Location Pages</option>
          <option value="blog">Blog Posts</option>
          <option value="static">Static Pages</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`${inputCls} bg-white`}>
          <option value="all">All Status</option>
          <option value="live">Live</option>
          <option value="draft">Draft</option>
        </select>
        <select value={seoFilter} onChange={e => setSeoFilter(e.target.value)} className={`${inputCls} bg-white`}>
          <option value="all">All SEO</option>
          <option value="configured">Configured</option>
          <option value="missing">Missing</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Page</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">URL</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">SEO</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(page => (
              <React.Fragment key={page.slug}>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{page.label}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{page.url}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_LABELS[page.type]?.color}`}>
                      {TYPE_LABELS[page.type]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      page.isLive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>{page.isLive ? 'Live' : 'Draft'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      page.hasMeta ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>{page.hasMeta ? '✓ Configured' : '⚠ Missing'}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEditorSlug === page.slug ? onCloseEditor() : onOpenEditor(page.slug)}
                      className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700">
                      {openEditorSlug === page.slug ? 'Close' : 'Edit SEO'}
                    </button>
                  </td>
                </tr>
                {openEditorSlug === page.slug && (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <InlineEditor
                        page={page} form={editorForm} saving={editorSaving}
                        onChange={onEditorChange} onSave={() => onSaveMeta(page.slug)}
                        onCancel={onCloseEditor}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                  No pages match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function InlineEditor({ page, form, saving, onChange, onSave, onCancel }: {
  page: SeoPageRow
  form: EditorForm
  saving: boolean
  onChange: (field: keyof EditorForm, value: string) => void
  onSave: () => void
  onCancel: () => void
}) {
  const cls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'
  return (
    <div className="bg-blue-50 border-t border-b border-blue-200 p-5 space-y-3">
      <p className="text-xs font-semibold text-blue-700 mb-1">Editing SEO — {page.label}</p>
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-xs font-medium text-gray-700">Meta Title</label>
          <CharCount value={form.meta_title} max={60} />
        </div>
        <input value={form.meta_title} onChange={e => onChange('meta_title', e.target.value)} className={cls} placeholder="Page title for Google (50–60 chars)" />
      </div>
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-xs font-medium text-gray-700">Meta Description</label>
          <CharCount value={form.meta_description} max={160} />
        </div>
        <textarea value={form.meta_description} onChange={e => onChange('meta_description', e.target.value)} rows={2} className={cls} placeholder="Page description for Google (150–160 chars)" />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-700 block mb-1">Focus Keyword</label>
        <input value={form.focus_keyword} onChange={e => onChange('focus_keyword', e.target.value)} className={cls} placeholder="e.g. pest control Tyler TX" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-medium text-gray-700">OG Title</label>
            <CharCount value={form.og_title} max={60} />
          </div>
          <input value={form.og_title} onChange={e => onChange('og_title', e.target.value)} className={cls} placeholder="Social share title" />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-medium text-gray-700">OG Description</label>
            <CharCount value={form.og_description} max={160} />
          </div>
          <input value={form.og_description} onChange={e => onChange('og_description', e.target.value)} className={cls} placeholder="Social share description" />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onSave} disabled={saving}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        <button onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-white">
          Cancel
        </button>
      </div>
    </div>
  )
}
