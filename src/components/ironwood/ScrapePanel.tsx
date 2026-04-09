import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import ScrapeResultsTable from './ScrapeResultsTable'
import SiteRecreationCard from './SiteRecreationCard'
import type { SiteRecreation } from './SiteRecreationCard'
import GenerateProLayout from './GenerateProLayout'
import ExportForBolt from './ExportForBolt'
import type { Prospect } from './types'

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

// Fields the Apply action must never touch
const PROTECTED_FIELDS = new Set(['salesperson', 'onboarding_rep', 'status', 'call_date'])

interface ScrapeState {
  scraping:       boolean
  error:          string
  result:         ScrapedData | null
  pages:          string[]
  pagesFound:     number
  applied:        boolean
  siteRecreation: SiteRecreation | null
}

interface Props {
  sourceUrl:          string
  onSourceUrlChange:  (url: string) => void
  prospectId:         string | null
  onApplyScraped:     (data: Partial<ScrapedData>) => void
  onApplyRecreation:  (data: SiteRecreation) => void
  tier?:              string | null
  form?:              Partial<Prospect>
}

export default function ScrapePanel({ sourceUrl, onSourceUrlChange, prospectId, onApplyScraped, onApplyRecreation, tier, form }: Props) {
  const isProElite = tier === 'pro' || tier === 'elite'
  const [state, setState] = useState<ScrapeState>({
    scraping: false, error: '', result: null, pages: [], pagesFound: 0, applied: false, siteRecreation: null,
  })

  const handleScrape = async () => {
    if (!sourceUrl) return
    setState(s => ({ ...s, scraping: true, error: '', result: null, pages: [], pagesFound: 0, applied: false, siteRecreation: null }))
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession()
      if (!session || sessionError) {
        setState(s => ({ ...s, scraping: false, error: 'Session expired — please refresh the page.' }))
        return
      }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-prospect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ url: sourceUrl, prospectId }),
      })

      const data = await res.json()
      if (!data.success) {
        setState(s => ({ ...s, scraping: false, error: data.error || 'Scrape failed' }))
        return
      }

      setState(s => ({
        ...s,
        scraping: false,
        result: data.scraped,
        pages: data.pages_scraped || [],
        pagesFound: data.pagesFound ?? 0,
        siteRecreation: data.siteRecreation ?? null,
      }))
    } catch {
      setState(s => ({ ...s, scraping: false, error: 'Network error — check your connection.' }))
    }
  }

  const handleApply = () => {
    if (!state.result) return
    // Only pass fields that are non-null, non-empty, and not in the protected list
    const safe: Partial<ScrapedData> = {}
    for (const [k, v] of Object.entries(state.result)) {
      if (PROTECTED_FIELDS.has(k)) continue
      if (v === null || v === '' || (Array.isArray(v) && v.length === 0)) continue
      ;(safe as Record<string, unknown>)[k] = v
    }
    onApplyScraped(safe)
    setState(s => ({ ...s, applied: true }))
  }

  const handleDiscard = () => {
    setState(s => ({ ...s, result: null, pages: [], pagesFound: 0, applied: false, siteRecreation: null }))
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
        <>
          <ScrapeResultsTable
            result={state.result}
            pagesScraped={state.pages}
            onApply={handleApply}
            onDiscard={handleDiscard}
          />
          <p className="text-blue-400 text-xs mt-2">
            {state.pagesFound > 0
              ? `${state.pagesFound} page${state.pagesFound === 1 ? '' : 's'} of content found and saved — will be used to seed this client's site.`
              : 'No additional page content found.'}
          </p>
          {state.siteRecreation && (
            <SiteRecreationCard
              initial={state.siteRecreation}
              onApply={onApplyRecreation}
            />
          )}
        </>
      )}

      {state.applied && (
        <p className="text-emerald-400 text-xs mt-3 font-medium">
          ✓ Data applied — review each field and save when ready.
        </p>
      )}

      {isProElite && prospectId && (
        <div className="mt-5 border-t border-gray-700 pt-4">
          <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wide mb-3">Pro Build Options</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1">⚡ AI Quick Build</p>
              <p className="text-xs text-gray-600 mb-2">Same-day launch via YouPest shell</p>
              <GenerateProLayout prospectId={prospectId} tier={tier ?? null} form={form ?? {}} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1">📦 Custom Bolt Build</p>
              <p className="text-xs text-gray-600 mb-2">90% site match — export context for Bolt</p>
              <ExportForBolt prospectId={prospectId} companyName={form?.company_name ?? ''} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
