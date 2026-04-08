import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { Prospect, Salesperson } from './types'
import ContactSection       from './ProspectDetail.Contact'
import IntakeLinkSection    from './ProspectDetail.IntakeLink'
import OnboardingSection    from './ProspectDetail.Onboarding'
import SiteSetupSection     from './ProspectDetail.SiteSetup'
import IntegrationsSection  from './ProspectDetail.Integrations'
import ProvisionSection     from './ProspectDetail.Provisioning'
import RepGuideButton       from './RepGuideButton'
import RepGuideDrawer       from './RepGuideDrawer'
import ScrapePanel          from './ScrapePanel'
import type { ScrapedData } from './ScrapePanel'
import type { SiteRecreation } from './SiteRecreationCard'
import GenerateProLayout    from './GenerateProLayout'

interface Props {
  prospectId: string | null   // null = new prospect
  salespeople: Salesperson[]
  onClose: (refreshed?: boolean) => void
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30)
}

export default function ProspectDetail({ prospectId, salespeople, onClose }: Props) {
  const [form, setForm]               = useState<Partial<Prospect>>({ status: 'prospect', business_info: {}, branding: {}, customization: {} })
  const [saved, setSaved]             = useState(false)
  const [loading, setLoading]         = useState(!!prospectId)
  const [id, setId]                   = useState<string | null>(prospectId)
  const [slugEdited, setSlugEdited]   = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [guideSection, setGuideSection] = useState<string | null>(null)
  const timer                         = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (!prospectId) return
    supabase.from('prospects').select('*').eq('id', prospectId).maybeSingle().then(({ data }) => {
      if (data) {
        setForm(data)
        // Existing prospects with a slug should never have it overwritten by auto-gen
        if (data.slug) setSlugEdited(true)
      }
      setLoading(false)
    })
  }, [prospectId])

  const setField = useCallback((k: string, v: any) => {
    setForm(f => ({ ...f, [k]: v }))
  }, [])

  const save = useCallback(async (latest?: Partial<Prospect>) => {
    const data = latest ?? form
    if (!data.company_name?.trim()) return
    // Sync contact fields into business_info so provisioning uses the right values
    const syncedBi = {
      ...(data.business_info || {}),
      name:  data.company_name || (data.business_info as any)?.name || '',
      phone: data.phone        || (data.business_info as any)?.phone || '',
      email: data.email        || (data.business_info as any)?.email || '',
    }
    const dataToSave = { ...data, business_info: syncedBi }
    let saved_id = id
    if (!saved_id) {
      const { data: row, error } = await supabase.from('prospects').insert({
        ...dataToSave,
        status: dataToSave.status || 'prospect',
      }).select('id').single()
      if (!error && row) { saved_id = row.id; setId(row.id) }
    } else {
      await supabase.from('prospects').update({ ...dataToSave, updated_at: new Date().toISOString() }).eq('id', saved_id)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [form, id])

  const onBlur = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => save(), 800)
  }, [save])

  // Auto-generate slug when company name changes (stops once user manually edits slug)
  const handleCompanyName = (v: string) => {
    setField('company_name', v)
    if (!slugEdited) {
      setField('slug', slugify(v))
    }
    // suggest admin password on new prospects
    if (!form.admin_password && v) {
      const word = v.replace(/[^A-Za-z]/g, '').slice(0, 10)
      setField('admin_password', `${word}2026!`)
    }
  }

  const wrappedSetField = useCallback((k: string, v: any) => {
    if (k === 'company_name') handleCompanyName(v)
    else if (k === 'slug') {
      setSlugEdited(true)
      setField('slug', v)
    } else {
      setField(k, v)
    }
  }, [form, setField, slugEdited]) // eslint-disable-line

  const onUpdate = useCallback((updates: Partial<Prospect>) => {
    setForm(f => ({ ...f, ...updates }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [])

  const onApplyScraped = useCallback((data: Partial<ScrapedData>) => {
    setForm(f => {
      const bi = { ...(f.business_info || {}) } as Record<string, any>
      if (data.address)       bi.address        = data.address
      if (data.hours)         bi.hours          = data.hours
      if (data.tagline)       bi.tagline        = data.tagline
      if (data.founded_year)  bi.founded_year   = data.founded_year
      if (data.tech_count)    bi.num_technicians = data.tech_count
      if (data.license_number) bi.license       = data.license_number
      const updates: Partial<Prospect> = { business_info: bi }
      if (data.business_name)      updates.company_name    = data.business_name
      if (data.owner_name)         updates.contact_name    = data.owner_name
      if (data.phone)              updates.phone           = data.phone
      if (data.email)              updates.email           = data.email
      if (data.facebook_url)       updates.social_facebook = data.facebook_url
      if (data.instagram_handle)   updates.social_instagram = data.instagram_handle
      if (data.google_business_url) updates.social_google  = data.google_business_url
      // services and service_areas have no dedicated columns — log for rep reference
      if (data.services?.length)      console.log('[scrape] services:', data.services)
      if (data.service_areas?.length) console.log('[scrape] service_areas:', data.service_areas)
      return { ...f, ...updates }
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [])

  const onApplyRecreation = useCallback((data: SiteRecreation) => {
    setForm(f => ({
      ...f,
      branding: {
        ...(f.branding || {}),
        template: data.shell,
        primary_color: data.primaryColor,
        accent_color: data.accentColor,
        cta_text: data.ctaText,
      },
      customization: {
        ...(f.customization || {}),
        hero_headline: data.heroHeadline,
      },
      hero_headline: data.heroHeadline,
    }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [])

  async function saveTier(val: string) {
    if (!id) return
    await supabase.from('prospects').update({ tier: val }).eq('id', id)
    setField('tier', val)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleDelete() {
    if (!id) return
    setDeleting(true)
    await supabase.from('prospects').delete().eq('id', id)
    // intake_tokens cascade-deletes via FK ON DELETE CASCADE
    onClose(true)
  }

  if (loading) return null

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={() => onClose(true)}>
      <RepGuideDrawer section={guideSection} onClose={() => setGuideSection(null)} />
      <div className="w-full max-w-2xl bg-gray-950 border-l border-gray-800 h-full overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 px-5 py-3 bg-gray-950 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="font-bold text-white truncate">{form.company_name || 'New Prospect'}</h2>
              {form.tier === 'pro' && <span className="flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700">Pro</span>}
              {form.tier === 'growth' && <span className="flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-900/60 text-blue-300 border border-blue-700">Growth</span>}
              {(!form.tier || form.tier === 'starter') && <span className="flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-800 text-gray-400 border border-gray-600">Starter</span>}
            </div>
            <div className="flex items-center gap-3">
              {saved && <span className="text-xs text-emerald-400">✓ Saved</span>}
              <RepGuideButton section="faq" label="? Client FAQ" onOpen={setGuideSection} />
              <button onClick={() => onClose(true)} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
            </div>
          </div>
          {id && (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-gray-500 mr-1">Tier:</span>
              {(['starter', 'growth', 'pro'] as const).map(t => (
                <button key={t} onClick={() => saveTier(t)}
                  className={`px-3 py-0.5 text-xs rounded-full border transition capitalize ${
                    (form.tier ?? 'starter') === t
                      ? t === 'pro' ? 'bg-indigo-700 border-indigo-500 text-white'
                        : t === 'growth' ? 'bg-blue-700 border-blue-500 text-white'
                        : 'bg-gray-600 border-gray-400 text-white'
                      : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}>{t}</button>
              ))}
            </div>
          )}
        </div>

        {/* Sections */}
        <div className="p-5 space-y-6">
          <div className="flex justify-end"><RepGuideButton section="sales-call" onOpen={setGuideSection} /></div>
          <ContactSection form={form} setField={wrappedSetField} onBlur={onBlur} salespeople={salespeople} />
          <div className="border-t border-gray-800 pt-4">
            <ScrapePanel
              sourceUrl={form.website_url || ''}
              onSourceUrlChange={v => { wrappedSetField('website_url', v); onBlur() }}
              prospectId={id}
              onApplyScraped={onApplyScraped}
              onApplyRecreation={onApplyRecreation}
            />
          </div>
          {id && (
            <GenerateProLayout prospectId={id} tier={form.tier ?? null} />
          )}
          <div className="flex justify-end"><RepGuideButton section="intake" onOpen={setGuideSection} /></div>
          <IntakeLinkSection
            prospectId={id}
            adminEmail={form.admin_email ?? undefined}
            companyName={form.company_name ?? undefined}
            onImportSuccess={(data) => setForm(data)}
          />
          <div className="flex justify-end"><RepGuideButton section="invoice" onOpen={setGuideSection} /></div>
          <OnboardingSection form={form} setField={wrappedSetField} onBlur={onBlur} prospect={form} onUpdate={onUpdate} />
          <div className="flex items-center justify-end gap-2">
            <RepGuideButton section="prospect-fields" onOpen={setGuideSection} />
            <RepGuideButton section="shell-palette" onOpen={setGuideSection} />
          </div>
          <SiteSetupSection form={form} setField={wrappedSetField} onBlur={onBlur} />
          <IntegrationsSection prospectId={id} form={form} />
          <div className="flex justify-end">
            <RepGuideButton section={form.provisioned_at ? 'post-launch' : 'pre-provision'} label={form.provisioned_at ? '? Post-Launch Guide' : undefined} onOpen={setGuideSection} />
          </div>
          <ProvisionSection form={form} prospectId={id} onProvisioned={onUpdate} />

          {id && (
            <div className="pt-2 border-t border-gray-800">
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)}
                  className="text-xs text-red-500 hover:text-red-400 transition">
                  Delete this prospect
                </button>
              ) : (
                <div className="bg-gray-900 rounded-lg p-4 space-y-3">
                  {form.tenant_id && (
                    <p className="text-xs text-amber-400">This prospect has an active site. Deleting the prospect record will not affect the live site.</p>
                  )}
                  <p className="text-sm text-gray-300">
                    Delete <span className="font-medium text-white">{form.company_name || 'this prospect'}</span>? This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={handleDelete} disabled={deleting}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition disabled:opacity-50">
                      {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                    <button onClick={() => setConfirmDelete(false)}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
