import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { Prospect, Salesperson } from './types'
import ContactSection    from './ProspectDetail.Contact'
import IntakeLinkSection from './ProspectDetail.IntakeLink'
import OnboardingSection from './ProspectDetail.Onboarding'
import SiteSetupSection  from './ProspectDetail.SiteSetup'
import ProvisionSection  from './ProspectDetail.Provisioning'

interface Props {
  prospectId: string | null   // null = new prospect
  salespeople: Salesperson[]
  onClose: (refreshed?: boolean) => void
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30)
}

export default function ProspectDetail({ prospectId, salespeople, onClose }: Props) {
  const [form, setForm]             = useState<Partial<Prospect>>({ status: 'prospect', business_info: {}, branding: {}, customization: {} })
  const [saved, setSaved]           = useState(false)
  const [loading, setLoading]       = useState(!!prospectId)
  const [id, setId]                 = useState<string | null>(prospectId)
  const [slugEdited, setSlugEdited] = useState(false)
  const timer                       = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

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

  if (loading) return null

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={() => onClose(true)}>
      <div className="w-full max-w-2xl bg-gray-950 border-l border-gray-800 h-full overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 bg-gray-950 border-b border-gray-800">
          <h2 className="font-bold text-white truncate">{form.company_name || 'New Prospect'}</h2>
          <div className="flex items-center gap-3">
            {saved && <span className="text-xs text-emerald-400">✓ Saved</span>}
            <button onClick={() => onClose(true)} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
          </div>
        </div>

        {/* Sections */}
        <div className="p-5 space-y-6">
          <ContactSection form={form} setField={wrappedSetField} onBlur={onBlur} salespeople={salespeople} />
          <IntakeLinkSection prospectId={id} adminEmail={form.admin_email} companyName={form.company_name} />
          <OnboardingSection form={form} setField={wrappedSetField} onBlur={onBlur} prospect={form} onUpdate={onUpdate} />
          <SiteSetupSection form={form} setField={wrappedSetField} onBlur={onBlur} />
          <ProvisionSection form={form} prospectId={id} onProvisioned={onUpdate} />
        </div>
      </div>
    </div>
  )
}
