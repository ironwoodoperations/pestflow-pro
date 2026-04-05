import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'
import { usePlan } from '../../hooks/usePlan'

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

function HelpDrop({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <button type="button" onClick={() => setOpen(!open)} className="block text-xs text-gray-400 hover:text-gray-600 mt-1">
      {open ? '▾ ' + text : '▸ How do I find this?'}
    </button>
  )
}

export default function IntegrationsSection() {
  const { tenantId } = useTenant()
  const { canAccess } = usePlan()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showToken, setShowToken] = useState(false)
  const [form, setForm] = useState({ google_place_id: '', facebook_page_id: '', facebook_access_token: '', google_maps_embed_url: '', pexels_api_key: '', google_analytics_id: '', google_api_key: '', google_search_console_url: '', textbelt_api_key: '', owner_sms_number: '', ayrshare_api_key: '' })

  useEffect(() => {
    if (!tenantId) return
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle()
      .then(({ data }) => {
        if (data?.value) setForm(prev => ({ ...prev, google_place_id: data.value.google_place_id || '', facebook_page_id: data.value.facebook_page_id || '', facebook_access_token: data.value.facebook_access_token || '', google_maps_embed_url: data.value.google_maps_embed_url || '', pexels_api_key: data.value.pexels_api_key || '', google_analytics_id: data.value.google_analytics_id || '', google_api_key: data.value.google_api_key || '', google_search_console_url: data.value.google_search_console_url || '', textbelt_api_key: data.value.textbelt_api_key || '', owner_sms_number: data.value.owner_sms_number || '', ayrshare_api_key: data.value.ayrshare_api_key || '' }))
        setLoading(false)
      })
  }, [tenantId])

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    const { error } = await supabase.from('settings').upsert({ tenant_id: tenantId, key: 'integrations', value: form }, { onConflict: 'tenant_id,key' })
    setSaving(false)
    if (error) toast.error('Failed to save.'); else toast.success('Integrations saved!')
  }

  if (loading) return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><p className="text-gray-400">Loading...</p></div>

  return (
    <div className="space-y-4">
      <details className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <summary className="text-sm font-semibold text-blue-900 cursor-pointer select-none">🔌 Integrations — How to use this</summary>
        <div className="mt-3 text-sm text-blue-800 space-y-2">
          <p>Connect your website to other services you use.</p>
          <ul className="list-none space-y-1">
            <li><strong>FACEBOOK ACCESS TOKEN</strong> — Lets you post to Facebook directly from the Social tab.</li>
            <li><strong>FACEBOOK PAGE ID</strong> — Your Facebook business page ID number.</li>
            <li><strong>GOOGLE PLACE ID</strong> — Used to import Google reviews and send review request links.</li>
            <li><strong>GOOGLE MAPS EMBED URL</strong> — Shows a map on your location pages.</li>
          </ul>
          <p className="text-blue-700 italic">💡 Set up Google Place ID first — it enables automatic review imports and post-job review requests.</p>
        </div>
      </details>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Integrations</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Google Place ID</label>
            <input value={form.google_place_id} onChange={e => setForm(p => ({ ...p, google_place_id: e.target.value }))} placeholder="ChIJ..." className={inputClass} />
            <HelpDrop text="Find this in your Google Business Profile URL after /place/ or use the Place ID Finder tool." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Facebook Page ID</label>
            <input value={form.facebook_page_id} onChange={e => setForm(p => ({ ...p, facebook_page_id: e.target.value }))} placeholder="123456789" className={inputClass} />
            <HelpDrop text="Go to your Facebook Page → About → Page ID. It's a numeric ID." />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">Facebook Access Token</label>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${form.facebook_access_token ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${form.facebook_access_token ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                {form.facebook_access_token ? 'Connected' : 'Not connected'}
              </span>
            </div>
            <div className="flex gap-2">
              <input type={showToken ? 'text' : 'password'} value={form.facebook_access_token} onChange={e => setForm(p => ({ ...p, facebook_access_token: e.target.value }))} placeholder="EAAG..." className={`flex-1 ${inputClass}`} />
              <button type="button" onClick={() => setShowToken(!showToken)} className="border border-gray-300 text-gray-500 hover:bg-gray-50 px-3 py-2 rounded-lg text-xs font-medium">{showToken ? 'Hide' : 'Show'}</button>
            </div>
            {form.facebook_access_token && (
              <p className="text-xs text-amber-600 mt-1">⚠ Facebook tokens expire every 60 days. If posting stops working, regenerate your token in Meta Business Suite.</p>
            )}
            <details className="mt-2">
              <summary className="text-xs text-amber-800 font-semibold cursor-pointer select-none bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">📘 How to connect Facebook (step-by-step)</summary>
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1.5">
                <p className="font-semibold">To get your Page Access Token:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to <strong>Meta Business Suite</strong> (business.facebook.com)</li>
                  <li>Click <strong>Settings</strong> (gear icon, bottom left)</li>
                  <li>Under Business Assets, select your <strong>Facebook Page</strong></li>
                  <li>Go to <strong>Page Settings → Advanced → Page Access Tokens</strong></li>
                  <li>Click <strong>Generate Token</strong> and copy it here</li>
                </ol>
                <p className="font-semibold mt-2">To get your Page ID:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to your Facebook Page</li>
                  <li>Click <strong>About</strong> → scroll to the bottom</li>
                  <li>Copy the <strong>Page ID</strong> (numeric, e.g. 123456789)</li>
                </ol>
                <p className="text-amber-700 italic">Tip: Use a <strong>long-lived token</strong> for the best experience — it lasts 60 days vs 1 hour for short-lived tokens.</p>
              </div>
            </details>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Google Maps Embed URL</label>
            <input value={form.google_maps_embed_url} onChange={e => setForm(p => ({ ...p, google_maps_embed_url: e.target.value }))} placeholder="https://www.google.com/maps/embed?pb=..." className={inputClass} />
            <HelpDrop text="Go to Google Maps → Share → Embed a map → copy the src URL from the iframe." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Google Analytics ID</label>
            <div className="flex gap-2">
              <input value={form.google_analytics_id} onChange={e => setForm(p => ({ ...p, google_analytics_id: e.target.value }))} placeholder="G-XXXXXXXXXX" className={`flex-1 ${inputClass}`} />
              {form.google_analytics_id.trim() && (
                <button type="button" onClick={() => window.open('https://analytics.google.com', '_blank')} className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap">Open Analytics &rarr;</button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Format: G-XXXXXXXXXX — find this in Google Analytics → Admin → Data Streams</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Google Search Console URL</label>
            <input value={form.google_search_console_url} onChange={e => setForm(p => ({ ...p, google_search_console_url: e.target.value }))} placeholder="https://yoursite.com" className={inputClass} />
            <HelpDrop text="Paste your verified property URL from search.google.com/search-console" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Google API Key</label>
            <input value={form.google_api_key} onChange={e => setForm(p => ({ ...p, google_api_key: e.target.value }))} placeholder="AIzaSy..." className={inputClass} />
            <HelpDrop text="Used for Lighthouse PageSpeed audits in the SEO tab. Get a key from Google Cloud Console." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pexels API Key</label>
            <input value={form.pexels_api_key} onChange={e => setForm(p => ({ ...p, pexels_api_key: e.target.value }))} placeholder="Get free key at pexels.com/api" className={inputClass} />
            <HelpDrop text="Free stock photo search. Get your key at pexels.com/api" />
          </div>
          {canAccess(4) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ayrshare API Key</label>
              <input type="password" value={form.ayrshare_api_key} onChange={e => setForm(p => ({ ...p, ayrshare_api_key: e.target.value }))} placeholder="••••••••" className={inputClass} />
              <p className="text-xs text-gray-400 mt-1">Connect Ayrshare to post to all platforms at once (Elite plan)</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Textbelt API Key</label>
            <input type="password" value={form.textbelt_api_key} onChange={e => setForm(p => ({ ...p, textbelt_api_key: e.target.value }))} placeholder="••••••••" className={inputClass} />
            <p className="text-xs text-gray-400 mt-1">Get your key at textbelt.com — $25 for 500 texts</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Owner SMS Number</label>
            <input type="tel" value={form.owner_sms_number} onChange={e => setForm(p => ({ ...p, owner_sms_number: e.target.value }))} placeholder="+19035550100" className={inputClass} />
            <p className="text-xs text-gray-400 mt-1">Your mobile number to receive new lead alerts</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Integrations'}
          </button>
        </div>
      </div>
    </div>
  )
}
