import type { ConnectForm, IntegrationValues } from './seoTypes'
import { SearchConsoleMockPreview, GA4MockPreview, PageSpeedPanel } from './SeoConnectPreviews'

interface Props {
  integrations: IntegrationValues
  connectForm: ConnectForm
  connectSaving: string | null
  onChange: (field: keyof ConnectForm, value: string) => void
  onSave: (field: keyof ConnectForm) => void
  onRunCheckNow: () => void
}

function DataSourceCard({ icon, title, description, status, statusLabel, children, actionLabel, actionUrl }: {
  icon: string; title: string; description: string
  status: 'connected' | 'active' | 'not-connected'
  statusLabel?: string; children?: React.ReactNode
  actionLabel?: string; actionUrl?: string
}) {
  const badgeStyles = {
    connected: 'bg-emerald-100 text-emerald-700',
    active: 'bg-emerald-100 text-emerald-700',
    'not-connected': 'bg-gray-100 text-gray-500',
  }
  const defaultLabels = { connected: '● Connected', active: '● Active', 'not-connected': 'Not Connected' }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-semibold text-gray-800 text-sm">{title}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeStyles[status]}`}>
          {statusLabel ?? defaultLabels[status]}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-3">{description}</p>
      {children}
      {actionLabel && actionUrl && (
        <button onClick={() => window.open(actionUrl, '_blank')}
          className={`mt-3 text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
            status !== 'not-connected'
              ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}>
          {actionLabel} →
        </button>
      )}
    </div>
  )
}

function FieldRow({ value, placeholder, helper, saving, onSave, onChange }: {
  value: string; placeholder: string; helper: string
  saving: boolean; onSave: () => void; onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
        <button onClick={onSave} disabled={saving}
          className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-medium hover:bg-gray-700 disabled:opacity-50 whitespace-nowrap">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      <p className="text-xs text-gray-400">{helper}</p>
    </div>
  )
}

export default function SeoConnectTab({
  integrations, connectForm, connectSaving, onChange, onSave
}: Props) {
  const { google_analytics_id, google_search_console_url } = integrations

  return (
    <div>
      <div className="mb-5">
        <h3 className="font-semibold text-gray-800">Connect Data Sources</h3>
        <p className="text-sm text-gray-500 mt-0.5">Each connection unlocks more insight into how your site is performing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DataSourceCard icon="🔍" title="Google Search Console"
          description="Clicks, impressions, CTR, avg position, and index coverage — directly from Google."
          status={google_search_console_url ? 'connected' : 'not-connected'}
          actionLabel={google_search_console_url ? 'Open Search Console' : undefined}
          actionUrl="https://search.google.com/search-console">
          {!google_search_console_url && <SearchConsoleMockPreview />}
          <FieldRow value={connectForm.google_search_console_url} placeholder="https://yoursite.com"
            helper="Go to search.google.com/search-console → Add Property"
            saving={connectSaving === 'google_search_console_url'}
            onChange={v => onChange('google_search_console_url', v)}
            onSave={() => onSave('google_search_console_url')} />
        </DataSourceCard>

        <DataSourceCard icon="📊" title="Google Analytics 4"
          description="Users, sessions, engagement rate, top pages, traffic sources, and scroll depth."
          status={google_analytics_id ? 'connected' : 'not-connected'}
          actionLabel={google_analytics_id ? 'Open GA4' : undefined}
          actionUrl="https://analytics.google.com">
          {!google_analytics_id && <GA4MockPreview />}
          <FieldRow value={connectForm.google_analytics_id} placeholder="G-XXXXXXXXXX"
            helper="GA4 Admin → Data Streams → your stream → Measurement ID"
            saving={connectSaving === 'google_analytics_id'}
            onChange={v => onChange('google_analytics_id', v)}
            onSave={() => onSave('google_analytics_id')} />
        </DataSourceCard>

        <DataSourceCard icon="⚡" title="Google PageSpeed Insights"
          description="Performance scores, Core Web Vitals, Lighthouse audit, accessibility and SEO scores. Powers the Overview tab."
          status="active" statusLabel="Active — No Setup Required">
          <PageSpeedPanel />
        </DataSourceCard>

        <DataSourceCard icon="▲" title="Vercel Analytics"
          description="Page views, unique visitors, top pages, geography, and device types. Built into your Vercel hosting."
          status="active" statusLabel="Active — Auto-Connected"
          actionLabel="View Vercel Analytics" actionUrl="https://vercel.com/analytics" />

        <DataSourceCard icon="🔗" title="Ahrefs Webmaster Tools"
          description="Backlink profile, referring domains, broken backlinks, organic keywords, and technical site audits."
          status="not-connected" actionLabel="Sign Up Free" actionUrl="https://ahrefs.com/webmaster-tools">
          <p className="text-xs text-gray-400">Free — just verify site ownership. No integration required.</p>
        </DataSourceCard>

        <DataSourceCard icon="🔎" title="Bing Webmaster Tools"
          description="Bing search performance, backlink data, SEO analyzer, keyword research. Shares data Google won't show you."
          status="not-connected" actionLabel="Sign Up Free" actionUrl="https://bing.com/webmasters">
          <p className="text-xs text-gray-400">Free — gives backlink data Google won't show.</p>
        </DataSourceCard>
      </div>
    </div>
  )
}
