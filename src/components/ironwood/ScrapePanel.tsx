import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import ScrapeResultsTable from './ScrapeResultsTable'
import SiteRecreationCard from './SiteRecreationCard'
import type { SiteRecreation } from './SiteRecreationCard'
import type { Prospect } from './types'
import { readVerticalChoice } from './provisionInputs'

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
  scrapedContent: Record<string, unknown> | null
  pathsTried:     number
  discardedCount: number
  unreachable:    number
  pagesKept:      number
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
  // S347 — REQUIRED, not optional. As an optional prop this silently degraded
  // to "no vertical", which the edge function read as "not stated" and answered
  // with pest paths. An optional prop whose absence means WRONG TRADE is a bad
  // default; required makes a missing wiring a compile error instead of ten
  // pest pages on a lawn prospect.
  form:               Partial<Prospect>
}

export default function ScrapePanel({ sourceUrl, onSourceUrlChange, prospectId, onApplyScraped, onApplyRecreation, tier, form }: Props) {
  const isProElite = tier === 'pro' || tier === 'elite'
  const [state, setState] = useState<ScrapeState>({
    scraping: false, error: '', result: null, pages: [], pagesFound: 0, scrapedContent: null,
    pathsTried: 0, discardedCount: 0, unreachable: 0, pagesKept: 0, applied: false, siteRecreation: null,
  })

  // null when the operator has not chosen a trade yet — the edge function reads
  // that as "not stated" and falls back, rather than assuming pest.
  const { vertical: scrapeVertical } = readVerticalChoice(
    (form.business_info || null) as Parameters<typeof readVerticalChoice>[0],
  )

  const handleScrape = async () => {
    if (!sourceUrl) return
    setState(s => ({ ...s, scraping: true, error: '', result: null, pages: [], pagesFound: 0, scrapedContent: null, pathsTried: 0, discardedCount: 0, unreachable: 0, pagesKept: 0, applied: false, siteRecreation: null }))
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
        // S346 — send the vertical so the scrape looks for THIS trade's pages.
        // Without it the function falls back to the historical pest path list
        // and a lawn company's mowing, stonework and turf pages are never
        // fetched. The form already holds it (set by the S342 picker); reading
        // it here is what makes the vertical-aware scrape actually do anything.
        body: JSON.stringify({ url: sourceUrl, prospectId, vertical: scrapeVertical }),
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
        scrapedContent: data.scrapedContent ?? null,
        pathsTried: data.paths_tried ?? 0,
        discardedCount: data.discarded_count ?? 0,
        unreachable: data.unreachable ?? 0,
        pagesKept: data.pages_kept ?? 0,
        siteRecreation: data.siteRecreation ?? null,
      }))
    } catch {
      setState(s => ({ ...s, scraping: false, error: 'Network error — check your connection.' }))
    }
  }

  // S348 — the page overlay is PERSISTED HERE, at the point of acceptance.
  // scrape-prospect no longer writes it (see that function's S348 note): it used
  // to save the moment the scrape finished, so a run nobody accepted still left
  // rows on the prospect that provision-tenant would overlay onto a live site.
  const handleApply = async () => {
    if (!state.result) return
    // Only pass fields that are non-null, non-empty, and not in the protected list
    const safe: Partial<ScrapedData> = {}
    for (const [k, v] of Object.entries(state.result)) {
      if (PROTECTED_FIELDS.has(k)) continue
      if (v === null || v === '' || (Array.isArray(v) && v.length === 0)) continue
      ;(safe as Record<string, unknown>)[k] = v
    }
    onApplyScraped(safe)

    if (prospectId && state.scrapedContent && Object.keys(state.scrapedContent).length > 0) {
      const { error } = await supabase
        .from('prospects')
        .update({ scraped_content: state.scrapedContent, source_url: sourceUrl })
        .eq('id', prospectId)
      if (error) {
        // Visible, not swallowed: the operator must not believe the page
        // content was kept when it was not.
        setState(s => ({ ...s, error: `Fields applied, but saving the page content failed: ${error.message}` }))
        return
      }
    }
    setState(s => ({ ...s, applied: true }))
  }

  // S348 — DISCARD MUST ACTUALLY DISCARD. This used to clear React state only,
  // while the row kept whatever a previous run had saved. It now clears the
  // stored overlay too, so a prospect that has been discarded carries nothing
  // for provision-tenant to pick up. A failure here is SURFACED — a Discard
  // that silently leaves the row is worse than no button at all.
  const handleDiscard = async () => {
    if (prospectId) {
      const { error } = await supabase
        .from('prospects')
        .update({ scraped_content: null, source_url: null })
        .eq('id', prospectId)
      if (error) {
        setState(s => ({ ...s, error: `Could not clear the saved page content: ${error.message}. It is still on the prospect.` }))
        return
      }
    }
    setState(s => ({ ...s, result: null, pages: [], pagesFound: 0, pathsTried: 0, discardedCount: 0, unreachable: 0, pagesKept: 0, applied: false, siteRecreation: null, scrapedContent: null, error: '' }))
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
          {/* S347 — count what SURVIVED the filter, not what was fetched.
              S346C — and make the arithmetic RECONCILE: the first live run said
              "23 tried, 1 saved (9 skipped)" and left 13 unexplained. Those were
              paths Firecrawl could not reach at all. tried = unreachable +
              discarded + kept, and a test asserts the identity. */}
          <p className="text-blue-400 text-xs mt-2">
            {state.pathsTried > 0
              ? `${state.pathsTried} path${state.pathsTried === 1 ? '' : 's'} tried · ${state.unreachable} unreachable · ${state.discardedCount} discarded · ${state.pagesKept} real page${state.pagesKept === 1 ? '' : 's'}${state.pagesFound !== state.pagesKept ? ` (${state.pagesFound} mapped to a page slug)` : ''} — will be used to seed this client's site.`
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
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1">🛠 Full Custom Build</p>
            <p className="text-xs text-gray-600">Custom theme built from your existing site — set Build Path to Full Custom, then download the Claude Code prompt below in Build Files.</p>
          </div>
        </div>
      )}
    </div>
  )
}
