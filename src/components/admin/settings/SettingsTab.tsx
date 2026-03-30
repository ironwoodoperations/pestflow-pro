import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'
import PageHelpBanner from '../PageHelpBanner'

const SUB_TABS = ['Business Info', 'Branding', 'Social Links', 'Notifications', 'Integrations'] as const

interface BusinessInfoForm {
  name: string
  phone: string
  email: string
  address: string
  hours: string
  tagline: string
  license: string
  after_hours_phone: string
  year_founded: string
}

interface BrandingForm {
  logo_url: string
  favicon_url: string
  primary_color: string
  accent_color: string
  template: 'bold' | 'clean' | 'modern'
}

export default function SettingsTab() {
  const [activeSubTab, setActiveSubTab] = useState<string>('Business Info')

  return (
    <div className="text-gray-300">
      <h2 className="text-xl font-semibold text-white mb-4">Settings</h2>
      <div className="flex gap-2 mb-6">
        {SUB_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeSubTab === tab
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
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
      {activeSubTab === 'Integrations' && (
        <div className="bg-[var(--admin-card-bg)] rounded-xl p-6 border border-[var(--admin-sidebar-border)]">
          <p className="text-gray-500">Integrations settings coming soon.</p>
        </div>
      )}
    </div>
  )
}

function BusinessInfoSection() {
  const { tenantId } = useTenant()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<BusinessInfoForm>({
    name: '',
    phone: '',
    email: '',
    address: '',
    hours: '',
    tagline: '',
    license: '',
    after_hours_phone: '',
    year_founded: '',
  })

  useEffect(() => {
    if (!tenantId) return
    supabase
      .from('settings')
      .select('value')
      .eq('tenant_id', tenantId)
      .eq('key', 'business_info')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          setForm((prev) => ({
            ...prev,
            name: data.value.name || '',
            phone: data.value.phone || '',
            email: data.value.email || '',
            address: data.value.address || '',
            hours: data.value.hours || '',
            tagline: data.value.tagline || '',
            license: data.value.license || '',
            after_hours_phone: data.value.after_hours_phone || '',
            year_founded: data.value.year_founded || '',
          }))
        }
        setLoading(false)
      })
  }, [tenantId])

  function updateField(field: keyof BusinessInfoForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    const { error } = await supabase
      .from('settings')
      .upsert({
        tenant_id: tenantId,
        key: 'business_info',
        value: form,
      }, { onConflict: 'tenant_id,key' })

    setSaving(false)
    if (error) {
      toast.error('Failed to save business info.')
    } else {
      toast.success('Business info saved!')
    }
  }

  if (loading) {
    return (
      <div className="bg-[var(--admin-card-bg)] rounded-xl p-6 border border-[var(--admin-sidebar-border)]">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

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
    <div>
      <PageHelpBanner tab="settings-business" />
      <div className="bg-[var(--admin-card-bg)] rounded-xl p-6 border border-[var(--admin-sidebar-border)]">
        <h3 className="text-lg font-semibold text-white mb-4">Business Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-400 mb-1">{f.label}</label>
              <input
                type={f.type || 'text'}
                value={form[f.key]}
                onChange={(e) => updateField(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-gray-600"
              />
            </div>
          ))}
        </div>
        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-6 py-3 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Business Info'}
          </button>
        </div>
      </div>
    </div>
  )
}

function BrandingSection() {
  const { tenantId } = useTenant()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<BrandingForm>({
    logo_url: '',
    favicon_url: '',
    primary_color: '#10b981',
    accent_color: '#f5c518',
    template: 'bold',
  })

  useEffect(() => {
    if (!tenantId) return
    supabase
      .from('settings')
      .select('value')
      .eq('tenant_id', tenantId)
      .eq('key', 'branding')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          setForm((prev) => ({
            ...prev,
            logo_url: data.value.logo_url || '',
            favicon_url: data.value.favicon_url || '',
            primary_color: data.value.primary_color || '#ff6a00',
            accent_color: data.value.accent_color || '#f5c518',
            template: data.value.template || 'bold',
          }))
        }
        setLoading(false)
      })
  }, [tenantId])

  function updateField(field: keyof BrandingForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    const { error } = await supabase
      .from('settings')
      .upsert({
        tenant_id: tenantId,
        key: 'branding',
        value: form,
      }, { onConflict: 'tenant_id,key' })

    setSaving(false)
    if (error) {
      toast.error('Failed to save branding settings.')
    } else {
      toast.success('Branding settings saved!')
    }
  }

  if (loading) {
    return (
      <div className="bg-[var(--admin-card-bg)] rounded-xl p-6 border border-[var(--admin-sidebar-border)]">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  const templates: { value: BrandingForm['template']; label: string; desc: string }[] = [
    { value: 'bold', label: 'Bold', desc: 'Aggressive & high-energy. Orange, dark backgrounds, Bangers headlines.' },
    { value: 'clean', label: 'Clean', desc: 'Professional & trustworthy. Navy, white backgrounds, serif headings.' },
    { value: 'modern', label: 'Modern', desc: 'Sleek & contemporary. Dark, teal accents, monospace headings.' },
  ]

  return (
    <div>
      <PageHelpBanner tab="settings-branding" />
      <div className="bg-[var(--admin-card-bg)] rounded-xl p-6 border border-[var(--admin-sidebar-border)]">
        <h3 className="text-lg font-semibold text-white mb-4">Branding</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Logo URL</label>
            <input
              type="text"
              value={form.logo_url}
              onChange={(e) => updateField('logo_url', e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-gray-600"
            />
            {form.logo_url && (
              <img src={form.logo_url} alt="Logo preview" className="mt-2 h-12 object-contain rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Favicon URL</label>
            <input
              type="text"
              value={form.favicon_url}
              onChange={(e) => updateField('favicon_url', e.target.value)}
              placeholder="https://example.com/favicon.ico"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-gray-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Primary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={form.primary_color}
                onChange={(e) => updateField('primary_color', e.target.value)}
                className="h-10 w-14 rounded border border-gray-700 bg-gray-800 cursor-pointer"
              />
              <input
                type="text"
                value={form.primary_color}
                onChange={(e) => updateField('primary_color', e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Accent Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={form.accent_color}
                onChange={(e) => updateField('accent_color', e.target.value)}
                className="h-10 w-14 rounded border border-gray-700 bg-gray-800 cursor-pointer"
              />
              <input
                type="text"
                value={form.accent_color}
                onChange={(e) => updateField('accent_color', e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-3">Template</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {templates.map((t) => (
              <button
                key={t.value}
                onClick={() => updateField('template', t.value)}
                className={`text-left p-4 rounded-xl border-2 transition ${
                  form.template === t.value
                    ? 'border-emerald-500 bg-gray-800'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <h4 className="text-white font-bold mb-1">{t.label}</h4>
                <p className="text-gray-400 text-sm">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-6 py-3 transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Branding'}
        </button>
      </div>
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

  if (loading) return <div className="bg-[var(--admin-card-bg)] rounded-xl p-6 border border-[var(--admin-sidebar-border)]"><p className="text-gray-500">Loading...</p></div>

  const fields = [
    { label: 'Facebook URL', key: 'facebook' as const, placeholder: 'https://facebook.com/yourpage' },
    { label: 'Instagram URL', key: 'instagram' as const, placeholder: 'https://instagram.com/yourpage' },
    { label: 'Google Business Profile URL', key: 'google' as const, placeholder: 'https://g.page/yourbusiness' },
    { label: 'Yelp URL (optional)', key: 'yelp' as const, placeholder: 'https://yelp.com/biz/yourbusiness' },
  ]

  return (
    <div className="bg-[var(--admin-card-bg)] rounded-xl p-6 border border-[var(--admin-sidebar-border)]">
      <h3 className="text-lg font-semibold text-white mb-4">Social Links</h3>
      <div className="space-y-4">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-gray-400 mb-1">{f.label}</label>
            <input type="url" value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-gray-600" />
          </div>
        ))}
      </div>
      <div className="mt-6">
        <button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-6 py-3 transition disabled:opacity-50">
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
        if (data?.value) setForm(prev => ({
          ...prev,
          lead_email: data.value.lead_email || '',
          cc_email: data.value.cc_email || '',
          monthly_report_email: data.value.monthly_report_email || '',
          notify_new_lead: data.value.notify_new_lead !== false,
          weekly_seo_digest: data.value.weekly_seo_digest === true,
        }))
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

  if (loading) return <div className="bg-[var(--admin-card-bg)] rounded-xl p-6 border border-[var(--admin-sidebar-border)]"><p className="text-gray-500">Loading...</p></div>

  return (
    <div className="bg-[var(--admin-card-bg)] rounded-xl p-6 border border-[var(--admin-sidebar-border)]">
      <h3 className="text-lg font-semibold text-white mb-4">Notifications</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Lead Notification Email</label>
          <input type="email" value={form.lead_email} onChange={e => setForm(prev => ({ ...prev, lead_email: e.target.value }))} placeholder="leads@yourbusiness.com"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-gray-600" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">CC Email (optional)</label>
          <input type="email" value={form.cc_email} onChange={e => setForm(prev => ({ ...prev, cc_email: e.target.value }))} placeholder="manager@yourbusiness.com"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-gray-600" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Monthly Report Email (optional)</label>
          <input type="email" value={form.monthly_report_email} onChange={e => setForm(prev => ({ ...prev, monthly_report_email: e.target.value }))} placeholder="owner@yourbusiness.com"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-gray-600" />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <input type="checkbox" checked={form.notify_new_lead} onChange={e => setForm(prev => ({ ...prev, notify_new_lead: e.target.checked }))}
            className="rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500" />
          <label className="text-sm text-gray-300">Notify on new lead</label>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={form.weekly_seo_digest} onChange={e => setForm(prev => ({ ...prev, weekly_seo_digest: e.target.checked }))}
            className="rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500" />
          <label className="text-sm text-gray-300">Weekly SEO digest email</label>
        </div>
      </div>
      <div className="mt-6">
        <button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-6 py-3 transition disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Notifications'}
        </button>
      </div>
    </div>
  )
}
