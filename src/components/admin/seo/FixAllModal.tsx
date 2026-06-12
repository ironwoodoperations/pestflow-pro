import type { SeoFixChain } from './useSeoFixChain'

const FIELD_LABEL: Record<string, string> = {
  intro: 'intro text',
  meta_title: 'SEO title',
  meta_description: 'meta description',
  focus_keyword: 'focus keyword',
}

// S263 — Elite "Fix all" preview + confirm. The button/modal are cosmetic; the real
// tier-4 gate is server-side (apply-finding-fix mode='fix_all' checks tier 4 FIRST).
// Lists each applyable change; notes that site-wide findings are skipped.
export default function FixAllModal({ fixChain }: { fixChain: SeoFixChain }) {
  if (!fixChain.fixAllOpen) return null
  const items = fixChain.applyableFindings
  const pages = new Set(items.map(i => i.slug)).size

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={fixChain.closeFixAll}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Fix all flagged pages</h3>
          <p className="text-sm text-gray-500 mt-1">
            This will apply {items.length} fix{items.length === 1 ? '' : 'es'} across {pages} page{pages === 1 ? '' : 's'}.
            Only suggestions you've generated are applied; pages you've edited by hand are kept as-is.
          </p>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {items.length === 0 ? (
            <p className="text-sm text-gray-400">No generated fixes are ready to apply yet. Generate a fix on a flagged page first.</p>
          ) : (
            <ul className="space-y-1.5">
              {items.map(({ pageLabel, finding }) => (
                <li key={finding.id} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span><span className="font-medium">{pageLabel}</span> — update {FIELD_LABEL[finding.fixField ?? ''] ?? finding.fixField}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-gray-400 mt-3">
            Site-wide issues (e.g. duplicate titles, search visibility) aren't one-click fixable and are skipped here.
          </p>
        </div>

        <div className="p-5 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={fixChain.closeFixAll} disabled={fixChain.fixAllRunning}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={fixChain.handleFixAll} disabled={fixChain.fixAllRunning || items.length === 0}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
            {fixChain.fixAllRunning ? 'Applying…' : `Apply ${items.length} fix${items.length === 1 ? '' : 'es'}`}
          </button>
        </div>
      </div>
    </div>
  )
}
