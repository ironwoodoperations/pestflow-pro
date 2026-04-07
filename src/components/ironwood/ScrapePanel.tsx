import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import ScrapeResultsTable from './ScrapeResultsTable'

export interface ScrapedData {
  business_name:       string | null
  owner_name:          string | null
  phone:               string | null
  email:               string | null
  address:             string | null
  city:                string | null
  state:               string | null
  zip:                 string | null
  hours:               string | null
  tagline:             string | null
  founded_year:        string | null
  tech_count:          string | null
  license_number:      string | null
  about_intro:         string | null
  services:            string[] | null
  service_areas:       string[] | null
  facebook_url:        string | null
  instagram_handle:    string | null
  google_business_url: string | null
}

interface ScrapeState {
  scraping:  boolean
  error:     string
  result:    ScrapedData | null
  pages:     string[]
  applied:   boolean
}

interface Props {
  sourceUrl:          string
  onSourceUrlChange:  (url: string) => void
  prospectId:         string | null
  onApplyScraped:     (data: ScrapedData) => void
}

export default function ScrapePanel({ sourceUrl, onSourceUrlChange, prospectId, onApplyScraped }: Props) {
  const [state, setState] = useState<ScrapeState>({
    scraping: false, error: '', result: null, pages: [], applied: false,
  })

  const handleScrape = async () => {
    if (!sourceUrl) return
    setState(s => ({ ...s, scraping: true, error: '', result: null, pages: [], applied: false }))
    try {
      let { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        const { data: r } = await supabase.auth.refreshSession()
        session = r.session
      }
      if (!session) {
        setState(s => ({ ...s, scraping: false, error: 'Session expired — please refresh.' }))
        return
      }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-prospect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ prospect_id: prospectId, url: sourceUrl }),
      })

      const data = await res.json()
      if (!data.success) {
        setState(s => ({ ...s, scraping: false, error: data.error || 'Scrape failed' }))
        return
      }

      setState(s => ({ ...s, scraping: false, result: data.scraped, pages: data.pages_scraped || [] }))
    } catch (err) {
      setState(s => ({ ...s, scraping: false, error: 'Network error — check your connection.' }))
    }
  }

  const handleApply = () => {
    if (!state.result) return
    onApplyScraped(state.result)
    setState(s => ({ ...s, applied: true }))
  }

  const handleDiscard = () => {
    setState(s => ({ ...s, result: null, pages: [], applied: false }))
  }

  return (
    <div className="border border-gray-700 rounded-xl p-5 bg-gray-900">
      <h3 className="font-semibold text-gray-200 mb-1">Import from Existing Website</h3>
      <p className="text-xs text-gray-500 mb-4">
        Paste the client's current website URL to auto-fill their information.
      </p>

      <div className="flex gap-3">
        <input
          type="url"
          value={sourceUrl}
          onChange={e => onSourceUrlChange(e.target.value)}
          placeholder="https://www.theirsite.com"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white
                     focus:outline-none focus:border-emerald-500 placeholder-gray-600"
        />
        <button
          onClick={handleScrape}
          disabled={state.scraping || !sourceUrl}
          className="bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-semibold
                     disabled:opacity-50 hover:bg-green-800 transition whitespace-nowrap"
        >
          {state.scraping ? 'Scraping…' : 'Scrape Site'}
        </button>
      </div>

      {state.error && (
        <p className="text-red-400 text-xs mt-2">{state.error}</p>
      )}

      {state.result && !state.applied && (
        <ScrapeResultsTable
          result={state.result}
          pagesScraped={state.pages}
          onApply={handleApply}
          onDiscard={handleDiscard}
        />
      )}

      {state.applied && (
        <p className="text-emerald-400 text-xs mt-3 font-medium">
          ✓ Data applied — review each field and save when ready.
        </p>
      )}
    </div>
  )
}
