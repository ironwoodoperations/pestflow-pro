import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { Prospect } from './types'
import type { GuideSection } from './ProspectFormGuide'
import type { ScrapedData } from './ScrapePanel'
import type { SiteRecreation } from './SiteRecreationCard'
import { archiveRecord } from '../../lib/archiveUtils'

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30)
}

export function useProspectDetail(
  prospectId: string | null,
  onClose: (refreshed?: boolean) => void,
  onArchived?: (id: string, name: string, tenantId?: string) => void,
) {
  const [form, setForm] = useState<Partial<Prospect>>({ status: 'prospect', tier: 'growth', business_info: {}, branding: {}, customization: {} })
  const [saved, setSaved]             = useState(false)
  const [loading, setLoading]         = useState(!!prospectId)
  const [id, setId]                   = useState<string | null>(prospectId)
  const [slugEdited, setSlugEdited]   = useState(false)
  const [openSection, setOpenSection] = useState<string | null>('build_path')
  const [guideSection, setGuideSection] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<GuideSection>(null)
  const [qaPassedAt, setQaPassedAt]   = useState<string | null>(null)
  const [seoScore, setSeoScore]       = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const hasAutoImported = useRef(false)

  useEffect(() => {
    if (!prospectId) return
    supabase.from('prospects').select('*').eq('id', prospectId).maybeSingle().then(({ data }) => {
      if (data) {
        setForm(data)
        if (data.slug) setSlugEdited(true)
        setOpenSection(data.provisioned_at ? 'qa_checklist' : 'build_path')
      }
      setLoading(false)
    })
    supabase.from('qa_checklists').select('qa_passed_at').eq('prospect_id', prospectId).maybeSingle()
      .then(({ data }) => { if (data?.qa_passed_at) setQaPassedAt(data.qa_passed_at) })
  }, [prospectId])

  // Auto-import intake data when intake is submitted and business_info is empty
  useEffect(() => {
    if (!form.intake_submitted_at) return
    if (hasAutoImported.current) return
    const bi = (form.business_info || {}) as Record<string, any>
    // Only skip if address AND hours are already populated — phone is synced from Contact
    // and should not block auto-import of intake address/hours/tagline/etc.
    const isEmpty = !bi.address && !bi.hours
    if (!isEmpty) return
    const d = (form.intake_data || {}) as Record<string, any>
    const biz = (d.business || {}) as Record<string, any>
    if (!biz.business_name && !biz.phone) return
    hasAutoImported.current = true
    setForm(f => {
      const existingBi = { ...(f.business_info || {}) } as Record<string, any>
      const newBi: Record<string, any> = { ...existingBi }
      if (biz.address)          newBi.address          = [biz.address, biz.city, biz.state, biz.zip].filter(Boolean).join(', ')
      if (biz.hours)            newBi.hours            = biz.hours
      if (biz.tagline)          newBi.tagline          = biz.tagline
      if (biz.founded_year)     newBi.founded_year     = biz.founded_year
      if (biz.license_number)   newBi.license          = biz.license_number
      if (biz.num_technicians)  newBi.num_technicians  = biz.num_technicians
      const u: Partial<Prospect> = { business_info: newBi }
      if (biz.business_name) u.company_name  = biz.business_name
      if (biz.owner_name)    u.contact_name  = biz.owner_name
      if (biz.phone)         u.phone         = biz.phone
      if (biz.email)         u.email         = biz.email
      return { ...f, ...u }
    })
  }, [form.intake_submitted_at, form.intake_data, form.business_info])

  // Auto-collapse Intake Link when submitted
  useEffect(() => {
    if (form.intake_submitted_at)
      setOpenSection(prev => prev === 'intake_link' ? null : prev)
  }, [form.intake_submitted_at])

  // Auto-collapse Package & Payment when invoice sent
  useEffect(() => {
    if (form.setup_invoice_sent_at)
      setOpenSection(prev => prev === 'package_payment' ? null : prev)
  }, [form.setup_invoice_sent_at])

  // Sync guide active section with open accordion section
  useEffect(() => {
    setActiveSection(openSection as GuideSection)
  }, [openSection])

  const setField = useCallback((k: string, v: any) => setForm(f => ({ ...f, [k]: v })), [])

  const save = useCallback(async (latest?: Partial<Prospect>) => {
    const data = latest ?? form
    if (!data.company_name?.trim()) return
    const syncedBi = {
      ...(data.business_info || {}),
      name:  data.company_name || (data.business_info as any)?.name || '',
      phone: data.phone        || (data.business_info as any)?.phone || '',
      email: data.email        || (data.business_info as any)?.email || '',
    }
    const toSave = { ...data, business_info: syncedBi }
    let sid = id
    if (!sid) {
      const { data: row, error } = await supabase.from('prospects').insert({ ...toSave, status: toSave.status || 'prospect' }).select('id').single()
      if (!error && row) {
        sid = row.id; setId(row.id)
        // Notify Teams — fire and forget
        const biz = data.company_name || ''
        const rep = (data as any).salesperson_name || ''
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-teams`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
          body: JSON.stringify({ message: `🆕 New prospect created: **${biz}**${rep ? ` — Rep: ${rep}` : ''}\nhttps://pestflowpro.com/ironwood` }),
        }).catch(() => {})
      }
    } else {
      await supabase.from('prospects').update({ ...toSave, updated_at: new Date().toISOString() }).eq('id', sid)
    }
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }, [form, id])

  const onBlur = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => save(), 800)
  }, [save])

  const handleCompanyName = useCallback((v: string) => {
    setField('company_name', v)
    if (!slugEdited) setField('slug', slugify(v))
    if (!form.admin_password && v) {
      const word = v.replace(/[^A-Za-z]/g, '').slice(0, 10)
      setField('admin_password', `${word}2026!`)
    }
  }, [form.admin_password, setField, slugEdited])

  const wrappedSetField = useCallback((k: string, v: any) => {
    if (k === 'company_name') handleCompanyName(v)
    else if (k === 'slug') { setSlugEdited(true); setField('slug', v) }
    else setField(k, v)
  }, [handleCompanyName, setField]) // eslint-disable-line

  const onUpdate = useCallback((updates: Partial<Prospect>) => {
    setForm(f => ({ ...f, ...updates }))
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }, [])

  const onProvisioned = useCallback((updates: Partial<Prospect>) => {
    setForm(f => ({ ...f, ...updates }))
    if (updates.provisioned_at) setOpenSection('qa_checklist')
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }, [])

  const onApplyScraped = useCallback((data: Partial<ScrapedData>) => {
    setForm(f => {
      const bi = { ...(f.business_info || {}) } as Record<string, any>
      if (data.address)        bi.address         = data.address
      if (data.hours)          bi.hours           = data.hours
      if (data.tagline)        bi.tagline         = data.tagline
      if (data.founded_year)   bi.founded_year    = data.founded_year
      if (data.tech_count)     bi.num_technicians = data.tech_count
      if (data.license_number) bi.license         = data.license_number
      const u: Partial<Prospect> = { business_info: bi }
      if (data.business_name)       u.company_name    = data.business_name
      if (data.owner_name)          u.contact_name    = data.owner_name
      if (data.phone)               u.phone           = data.phone
      if (data.email)               u.email           = data.email
      if (data.facebook_url)        u.social_facebook = data.facebook_url
      if (data.instagram_handle)    u.social_instagram = data.instagram_handle
      if (data.google_business_url) u.social_google   = data.google_business_url
      if (data.services?.length)      console.log('[scrape] services:', data.services)
      if (data.service_areas?.length) console.log('[scrape] service_areas:', data.service_areas)
      return { ...f, ...u }
    })
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }, [])

  const onApplyRecreation = useCallback((data: SiteRecreation) => {
    setForm(f => ({
      ...f,
      branding: { ...(f.branding || {}), template: data.shell, primary_color: data.primaryColor, accent_color: data.accentColor, cta_text: data.ctaText },
      customization: { ...(f.customization || {}), hero_headline: data.heroHeadline },
      hero_headline: data.heroHeadline,
    }))
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }, [])

  const saveTier = useCallback(async (val: string) => {
    setField('tier', val)
    if (!id) return
    await supabase.from('prospects').update({ tier: val }).eq('id', id)
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }, [id, setField])

  const handleArchive = useCallback(async () => {
    if (!id) return
    await archiveRecord('prospects', id, supabase)
    if (form.tenant_id) await archiveRecord('tenants', form.tenant_id, supabase)
    onArchived?.(id, form.company_name || 'Prospect', form.tenant_id ?? undefined)
    onClose(true)
  }, [form.company_name, form.tenant_id, id, onArchived, onClose])

  return {
    form, id, saved, loading,
    wrappedSetField, onBlur,
    onUpdate, onProvisioned, onApplyScraped, onApplyRecreation,
    saveTier, handleArchive,
    openSection, setOpenSection,
    guideSection, setGuideSection,
    activeSection, setActiveSection,
    qaPassedAt, setQaPassedAt,
    seoScore, setSeoScore,
  }
}
