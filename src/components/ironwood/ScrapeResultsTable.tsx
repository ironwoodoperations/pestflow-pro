import type { ScrapedData } from './ScrapePanel'

interface Props {
  result: ScrapedData
  pagesScraped: string[]
  onApply: () => void
  onDiscard: () => void
}

const FIELD_LABELS: [keyof ScrapedData, string][] = [
  ['business_name',    'Business Name'],
  ['owner_name',       'Owner Name'],
  ['phone',            'Phone'],
  ['email',            'Email'],
  ['address',          'Address'],
  ['hours',            'Hours'],
  ['tagline',          'Tagline'],
  ['founded_year',     'Founded Year'],
  ['tech_count',       '# Technicians'],
  ['license_number',   'License Number'],
  ['about_intro',      'About Description'],
  ['services',         'Services Found'],
  ['service_areas',    'Service Areas Found'],
  ['facebook_url',     'Facebook URL'],
  ['instagram_handle', 'Instagram'],
  ['google_business_url', 'Google Business URL'],
]

function displayValue(val: string | string[] | null): string {
  if (val === null || val === undefined) return ''
  if (Array.isArray(val)) return val.join(', ')
  return val
}

export default function ScrapeResultsTable({ result, pagesScraped, onApply, onDiscard }: Props) {
  return (
    <div className="mt-4 border border-gray-700 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-gray-900 border-b border-gray-700">
        <h4 className="font-semibold text-gray-200 text-sm">Review Scraped Data</h4>
        <p className="text-xs text-gray-500 mt-0.5">
          Check the fields below and click Apply to populate the form. You can edit anything after applying.
        </p>
      </div>

      <div className="divide-y divide-gray-800">
        {FIELD_LABELS.map(([key, label]) => {
          const val = result[key]
          const display = displayValue(val as string | string[] | null)
          return (
            <div key={key} className="flex items-start gap-3 px-4 py-2 text-sm">
              <span className="w-40 shrink-0 text-gray-500">{label}</span>
              {display
                ? <span className="text-gray-200 break-all">{display}</span>
                : <span className="text-gray-600 italic">Not found</span>
              }
            </div>
          )
        })}
      </div>

      <div className="px-4 py-3 bg-gray-900 border-t border-gray-700 flex items-center justify-between">
        <p className="text-xs text-gray-600">
          Pages scraped: {pagesScraped.join(', ')}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onDiscard}
            className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition"
          >
            Discard
          </button>
          <button
            onClick={onApply}
            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition"
          >
            Apply to Form
          </button>
        </div>
      </div>
    </div>
  )
}
