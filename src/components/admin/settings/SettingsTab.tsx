import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'

const SUB_TABS = ['Business Info', 'Branding', 'Social Links', 'Notifications', 'Hero Media', 'Integrations', 'Holiday Mode'] as const

interface BusinessInfoForm {
  name: string; phone: string; email: string; address: string; hours: string
  tagline: string; license: string; after_hours_phone: string; year_founded: string
}

interface BrandingForm {
  logo_url: string; favicon_url: string; primary_color: string; accent_color: string
  template: 'bold' | 'clean' | 'modern' | 'rustic'
}

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

export default function SettingsTab() {
  const [activeSubTab, setActiveSubTab] = useState<string>('Business Info')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-6 mb-6">
        {SUB_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeSubTab === tab
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeSubTab === 'Business Info' && <BusinessInfoSection />}
      {activeSubTab === 'Branding' && <BrandingSection />}
      {activeSubTab === 'Social Links' && <SocialLinksSection />}
      {activeSubTab === 'Notifications' && <NotificationsSection />}
      {activeSubTab === 'Hero Media' && <HeroMediaSection />}
      {activeSubTab === 'Integrations' && <IntegrationsSection />}
      {activeSubTab === 'Holiday Mode' && <HolidayModeSection />}
    </div>
  )
}

function BusinessInfoSection() {
  const { tenantId } = useTenant()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<BusinessInfoForm>({ name: '', phone: '', email: '', address: '', hours: '', tagline: '', license: '', after_hours_phone: '', year_founded: '' })

  useEffect(() => {
    if (!tenantId) return
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle()
      .then(({ data }) => {
        if (data?.value) setForm(prev => ({ ...prev, name: data.value.name || '', phone: data.value.phone || '', email: data.value.email || '', address: data.value.address || '', hours: data.value.hours || '', tagline: data.value.tagline || '', license: data.value.license || '', after_hours_phone: data.value.after_hours_phone || '', year_founded: data.value.year_founded || '' }))
        setLoading(false)
      })
  }, [tenantId])

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    const { error } = await supabase.from('settings').upsert({ tenant_id: tenantId, key: 'business_info', value: form }, { onConflict: 'tenant_id,key' })
    setSaving(false)
    if (error) toast.error('Failed to save business info.'); else toast.success('Business info saved!')
  }

  if (loading) return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><p className="text-gray-400">Loading...</p></div>

  const fields: { label: string; key: keyof BusinessInfoForm; type?: string; placeholder?: string }[] = [
    { label: 'Business Name', key: 'name', placeholder: 'Acme Pest Control' },
    { label: 'Phone Number', key: 'phone', placeholder: '(903) 555-0100' },
    { label: 'Email Address', key: 'email', type: 'email', placeholder: 'info@acmepest.com' },
    { label: 'Street Address', key: 'address', placeholder: '123 Main St, Tyler, TX 75701' },
    { label: 'Business Hours', key: 'hours', placeholder: 'Mon-Fri 8am-6pm, Sat 9am-2pm' },
    { label: 'Tagline', key: 'tagline', placeholder: 'Fast. Effective. Guaranteed.' },
    { label: 'License Number', key: 'license', placeholder: 'TPCL #12345' },
    { label: 'After-Hours Phone', key: 'after_hours_phone', placeholder: '(903) 555-0199' },
    { label: 'Year Founded', key: 'year_founded', placeholder: '2010' },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Business Information</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
            <input type={f.type || 'text'} value={form[f.key]} onChange={(e) => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder} className={inputClass} />
          </div>
        ))}
      </div>
      <div className="mt-6">
        <button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Business Info'}
        </button>
      </div>
    </div>
  )
}

function BrandingSection() {
  const { tenantId } = useTenant()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<BrandingForm>({ logo_url: '', favicon_url: '', primary_color: '#10b981', accent_color: '#f5c518', template: 'bold' })

  useEffect(() => {
    if (!tenantId) return
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle()
      .then(({ data }) => {
        if (data?.value) setForm(prev => ({ ...prev, logo_url: data.value.logo_url || '', favicon_url: data.value.favicon_url || '', primary_color: data.value.primary_color || '#10b981', accent_color: data.value.accent_color || '#f5c518', template: data.value.template || 'bold' }))
        setLoading(false)
      })
  }, [tenantId])

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    const { error } = await supabase.from('settings').upsert({ tenant_id: tenantId, key: 'branding', value: form }, { onConflict: 'tenant_id,key' })
    setSaving(false)
    if (error) toast.error('Failed to save branding settings.'); else toast.success('Branding settings saved!')
  }

  if (loading) return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><p className="text-gray-400">Loading...</p></div>

  const templates: { value: BrandingForm['template']; label: string; desc: string }[] = [
    { value: 'bold', label: 'Bold', desc: 'High-energy. Dark navy, emerald accents, Bangers headlines.' },
    { value: 'clean', label: 'Clean', desc: 'Professional. Navy, white backgrounds, serif headings.' },
    { value: 'modern', label: 'Modern', desc: 'Contemporary. Dark, teal accents, monospace headings.' },
    { value: 'rustic', label: 'Rustic', desc: 'Warm & inviting. Brown, amber accents, serif headings.' },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Branding</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Logo URL</label>
          <input type="text" value={form.logo_url} onChange={(e) => setForm(prev => ({ ...prev, logo_url: e.target.value }))} placeholder="https://example.com/logo.png" className={inputClass} />
          {form.logo_url && <img src={form.logo_url} alt="Logo preview" className="mt-2 h-12 object-contain rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Favicon URL</label>
          <input type="text" value={form.favicon_url} onChange={(e) => setForm(prev => ({ ...prev, favicon_url: e.target.value }))} placeholder="https://example.com/favicon.ico" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Primary Color</label>
          <div className="flex gap-2">
            <input type="color" value={form.primary_color} onChange={(e) => setForm(prev => ({ ...prev, primary_color: e.target.value }))} className="h-10 w-14 rounded border border-gray-300 cursor-pointer" />
            <input type="text" value={form.primary_color} onChange={(e) => setForm(prev => ({ ...prev, primary_color: e.target.value }))} className={`flex-1 ${inputClass}`} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Accent Color</label>
          <div className="flex gap-2">
            <input type="color" value={form.accent_color} onChange={(e) => setForm(prev => ({ ...prev, accent_color: e.target.value }))} className="h-10 w-14 rounded border border-gray-300 cursor-pointer" />
            <input type="text" value={form.accent_color} onChange={(e) => setForm(prev => ({ ...prev, accent_color: e.target.value }))} className={`flex-1 ${inputClass}`} />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Template</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {templates.map((t) => (
            <button key={t.value} onClick={() => setForm(prev => ({ ...prev, template: t.value }))}
              className={`text-left p-4 rounded-xl border-2 transition ${form.template === t.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <h4 className="text-gray-900 font-bold mb-1">{t.label}</h4>
              <p className="text-gray-500 text-sm">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Branding'}
      </button>
    </div>
  )
}

function SocialLinksSection() {
  const { tenantId } = useTenant()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ facebook: '', instagram: '', google: '', yelp: '' })

  useEffect(() => {
    if (!tenantId) return
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'social_links').maybeSingle()
      .then(({ data }) => {
        if (data?.value) setForm(prev => ({ ...prev, facebook: data.value.facebook || '', instagram: data.value.instagram || '', google: data.value.google || '', yelp: data.value.yelp || '' }))
        setLoading(false)
      })
  }, [tenantId])

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    const { error } = await supabase.from('settings').upsert({ tenant_id: tenantId, key: 'social_links', value: form }, { onConflict: 'tenant_id,key' })
    setSaving(false)
    if (error) toast.error('Failed to save social links.'); else toast.success('Social links saved!')
  }

  if (loading) return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><p className="text-gray-400">Loading...</p></div>

  const fields = [
    { label: 'Facebook URL', key: 'facebook' as const, placeholder: 'https://facebook.com/yourpage' },
    { label: 'Instagram URL', key: 'instagram' as const, placeholder: 'https://instagram.com/yourpage' },
    { label: 'Google Business Profile URL', key: 'google' as const, placeholder: 'https://g.page/yourbusiness' },
    { label: 'Yelp URL (optional)', key: 'yelp' as const, placeholder: 'https://yelp.com/biz/yourbusiness' },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Social Links</h3>
      <div className="space-y-4">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
            <input type="url" value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder} className={inputClass} />
          </div>
        ))}
      </div>
      <div className="mt-6">
        <button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Social Links'}
        </button>
      </div>
    </div>
  )
}

function NotificationsSection() {
  const { tenantId } = useTenant()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ lead_email: '', cc_email: '', monthly_report_email: '', notify_new_lead: true, weekly_seo_digest: false })

  useEffect(() => {
    if (!tenantId) return
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'notifications').maybeSingle()
      .then(({ data }) => {
        if (data?.value) setForm(prev => ({ ...prev, lead_email: data.value.lead_email || '', cc_email: data.value.cc_email || '', monthly_report_email: data.value.monthly_report_email || '', notify_new_lead: data.value.notify_new_lead !== false, weekly_seo_digest: data.value.weekly_seo_digest === true }))
        setLoading(false)
      })
  }, [tenantId])

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    const { error } = await supabase.from('settings').upsert({ tenant_id: tenantId, key: 'notifications', value: form }, { onConflict: 'tenant_id,key' })
    setSaving(false)
    if (error) toast.error('Failed to save notification settings.'); else toast.success('Notification settings saved!')
  }

  if (loading) return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><p className="text-gray-400">Loading...</p></div>

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Notifications</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Lead Notification Email</label>
          <input type="email" value={form.lead_email} onChange={e => setForm(prev => ({ ...prev, lead_email: e.target.value }))} placeholder="leads@yourbusiness.com" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">CC Email (optional)</label>
          <input type="email" value={form.cc_email} onChange={e => setForm(prev => ({ ...prev, cc_email: e.target.value }))} placeholder="manager@yourbusiness.com" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Monthly Report Email (optional)</label>
          <input type="email" value={form.monthly_report_email} onChange={e => setForm(prev => ({ ...prev, monthly_report_email: e.target.value }))} placeholder="owner@yourbusiness.com" className={inputClass} />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <input type="checkbox" checked={form.notify_new_lead} onChange={e => setForm(prev => ({ ...prev, notify_new_lead: e.target.checked }))} className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />
          <label className="text-sm text-gray-700">Notify on new lead</label>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={form.weekly_seo_digest} onChange={e => setForm(prev => ({ ...prev, weekly_seo_digest: e.target.checked }))} className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />
          <label className="text-sm text-gray-700">Weekly SEO digest email</label>
        </div>
      </div>
      <div className="mt-6">
        <button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Notifications'}
        </button>
      </div>
    </div>
  )
}

function HelpDrop({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <button type="button" onClick={() => setOpen(!open)} className="block text-xs text-gray-400 hover:text-gray-600 mt-1">
      {open ? '▾ ' + text : '▸ How do I find this?'}
    </button>
  )
}

function HeroMediaSection() {
  const { tenantId } = useTenant()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ youtube_id: '', thumbnail_url: '', hero_image_url: '' })

  useEffect(() => {
    if (!tenantId) return
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'hero_media').maybeSingle()
      .then(({ data }) => {
        if (data?.value) setForm(prev => ({ ...prev, youtube_id: data.value.youtube_id || '', thumbnail_url: data.value.thumbnail_url || '', hero_image_url: data.value.hero_image_url || '' }))
        setLoading(false)
      })
  }, [tenantId])

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    const { error } = await supabase.from('settings').upsert({ tenant_id: tenantId, key: 'hero_media', value: form }, { onConflict: 'tenant_id,key' })
    setSaving(false)
    if (error) toast.error('Failed to save.'); else toast.success('Hero media saved!')
  }

  if (loading) return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><p className="text-gray-400">Loading...</p></div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Hero Media</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">YouTube Video ID</label>
            <input value={form.youtube_id} onChange={e => setForm(p => ({ ...p, youtube_id: e.target.value }))} placeholder="dQw4w9WgXcQ" className={inputClass} />
            <p className="text-xs text-gray-400 mt-1">The ID from youtu.be/XXXXXX or ?v=XXXXXX</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Video Thumbnail URL</label>
            <input value={form.thumbnail_url} onChange={e => setForm(p => ({ ...p, thumbnail_url: e.target.value }))} placeholder="https://img.youtube.com/vi/.../maxresdefault.jpg" className={inputClass} />
            <p className="text-xs text-gray-400 mt-1">URL of the thumbnail shown before video plays</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Hero Image URL</label>
            <input value={form.hero_image_url} onChange={e => setForm(p => ({ ...p, hero_image_url: e.target.value }))} placeholder="https://example.com/hero.jpg" className={inputClass} />
            <p className="text-xs text-gray-400 mt-1">Fallback image if no video set</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Hero Media'}
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Preview</h4>
        {form.youtube_id ? (
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <iframe src={`https://www.youtube.com/embed/${form.youtube_id}`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Video preview" />
          </div>
        ) : form.thumbnail_url ? (
          <img src={form.thumbnail_url} alt="Thumbnail preview" className="w-full aspect-video object-cover rounded-lg" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : (
          <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-400 text-sm">No media configured</p>
          </div>
        )}
      </div>
    </div>
  )
}

function IntegrationsSection() {
  const { tenantId } = useTenant()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showToken, setShowToken] = useState(false)
  const [form, setForm] = useState({ google_place_id: '', facebook_page_id: '', facebook_access_token: '', google_maps_embed_url: '' })

  useEffect(() => {
    if (!tenantId) return
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle()
      .then(({ data }) => {
        if (data?.value) setForm(prev => ({ ...prev, google_place_id: data.value.google_place_id || '', facebook_page_id: data.value.facebook_page_id || '', facebook_access_token: data.value.facebook_access_token || '', google_maps_embed_url: data.value.google_maps_embed_url || '' }))
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
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Facebook Access Token</label>
          <div className="flex gap-2">
            <input type={showToken ? 'text' : 'password'} value={form.facebook_access_token} onChange={e => setForm(p => ({ ...p, facebook_access_token: e.target.value }))} placeholder="EAAG..." className={`flex-1 ${inputClass}`} />
            <button type="button" onClick={() => setShowToken(!showToken)} className="border border-gray-300 text-gray-500 hover:bg-gray-50 px-3 py-2 rounded-lg text-xs font-medium">{showToken ? 'Hide' : 'Show'}</button>
          </div>
          <HelpDrop text="Generate a Page Access Token from Meta Business Suite → Settings → Advanced. Required for social posting." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Google Maps Embed URL</label>
          <input value={form.google_maps_embed_url} onChange={e => setForm(p => ({ ...p, google_maps_embed_url: e.target.value }))} placeholder="https://www.google.com/maps/embed?pb=..." className={inputClass} />
          <HelpDrop text="Go to Google Maps → search your business → Share → Embed a map → copy the src URL from the iframe." />
        </div>
        <button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Integrations'}
        </button>
      </div>
    </div>
  )
}

function HolidayModeSection() {
  const { tenantId } = useTenant()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ enabled: false, holiday: '', message: '', auto_schedule: '' })

  useEffect(() => {
    if (!tenantId) return
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'holiday_mode').maybeSingle()
      .then(({ data }) => {
        if (data?.value) setForm(prev => ({ ...prev, enabled: data.value.enabled || false, holiday: data.value.holiday || '', message: data.value.message || '', auto_schedule: data.value.auto_schedule || '' }))
        setLoading(false)
      })
  }, [tenantId])

  async function save(updated?: Partial<typeof form>) {
    if (!tenantId) return
    const value = updated ? { ...form, ...updated } : form
    setSaving(true)
    const { error } = await supabase.from('settings').upsert({ tenant_id: tenantId, key: 'holiday_mode', value }, { onConflict: 'tenant_id,key' })
    setSaving(false)
    if (error) toast.error('Failed to save.'); else toast.success('Holiday mode updated!')
  }

  async function toggleEnabled() {
    const enabled = !form.enabled
    setForm(p => ({ ...p, enabled }))
    await save({ enabled })
  }

  if (loading) return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><p className="text-gray-400">Loading...</p></div>

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Holiday Mode</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">Enable Holiday Banner</p>
            <p className="text-xs text-gray-500 mt-0.5">Shows a yellow banner on all public pages</p>
          </div>
          <button onClick={toggleEnabled} className={`relative w-11 h-6 rounded-full transition-colors ${form.enabled ? 'bg-emerald-500' : 'bg-gray-200'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.enabled ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Holiday Name</label>
          <select value={form.holiday} onChange={e => setForm(p => ({ ...p, holiday: e.target.value }))} className={`${inputClass} bg-white`}>
            <option value="">Select holiday...</option>
            {['Christmas', 'Thanksgiving', "New Year's", 'Memorial Day', 'Labor Day', 'Fourth of July', 'Custom'].map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom Message</label>
          <input value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="We may have modified hours. Call to confirm." className={inputClass} />
        </div>
        <button onClick={() => save()} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Holiday Settings'}
        </button>
      </div>
    </div>
  )
}
