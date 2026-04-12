import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { Prospect, Salesperson } from './types'
import ContactSection       from './ProspectDetail.Contact'
import IntakeLinkSection    from './ProspectDetail.IntakeLink'
import OnboardingSection    from './ProspectDetail.Onboarding'
import SiteSetupSection     from './ProspectDetail.SiteSetup'
import IntegrationsSection  from './ProspectDetail.Integrations'
import ProvisionSection     from './ProspectDetail.Provisioning'
import OnboardingTimeline   from './ProspectDetail.Timeline'
import RepGuideButton       from './RepGuideButton'
import RepGuideDrawer       from './RepGuideDrawer'
import ScrapePanel          from './ScrapePanel'
import type { ScrapedData } from './ScrapePanel'
import type { SiteRecreation } from './SiteRecreationCard'

import CustomDomainSetup    from './CustomDomainSetup'
import BundleSocialSetup    from './BundleSocialSetup'
import { archiveRecord }    from '../../lib/archiveUtils'
import PipelineStage          from './PipelineStage'
import BuildPathSelector      from './BuildPathSelector'
import BuildStatusWidget      from './BuildStatusWidget'
import QAGate                 from './QAGate'
import SEOHealthPanel         from './SEOHealthPanel'
import RedirectMapPanel       from './RedirectMapPanel'
import ActivityLog            from './ActivityLog'
import ClaudeContextDownload  from './ClaudeContextDownload'
import FullCustomBuildGuide   from './FullCustomBuildGuide'
import ProspectFormGuide, { InlineGuide } from './ProspectFormGuide'
import type { GuideSection } from './ProspectFormGuide'
import CollapsibleSection from './CollapsibleSection'

interface Props {
  prospectId: string | null
  salespeople: Salesperson[]
  onClose: (refreshed?: boolean) => void
  onArchived?: (id: string, name: string, tenantId?: string) => void
}

const TIER_META = {
  starter: { label: 'Starter', price: '$149/mo', badgeCls: 'bg-gray-800 text-gray-400 border-gray-600',     activeCls: 'bg-gray-600 border-gray-400 text-white' },
  growth:  { label: 'Growth',  price: '$249/mo', badgeCls: 'bg-blue-900/60 text-blue-300 border-blue-700',  activeCls: 'bg-blue-700 border-blue-500 text-white' },
  pro:     { label: 'Pro',     price: '$349/mo', badgeCls: 'bg-indigo-900/60 text-indigo-300 border-indigo-700', activeCls: 'bg-indigo-700 border-indigo-500 text-white' },
  elite:   { label: 'Elite',   price: '$499/mo', badgeCls: 'bg-amber-900/60 text-amber-300 border-amber-700',   activeCls: 'bg-amber-700 border-amber-500 text-white' },
} as const

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30)
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}


export default function ProspectDetail({ prospectId, salespeople, onClose, onArchived }: Props) {
  const [form, setForm]               = useState<Partial<Prospect>>({ status: 'prospect', tier: 'growth', business_info: {}, branding: {}, customization: {} })
  const [saved, setSaved]             = useState(false)
  const [loading, setLoading]         = useState(!!prospectId)
  const [id, setId]                   = useState<string | null>(prospectId)
  const [slugEdited, setSlugEdited]   = useState(false)
  const [guideSection, setGuideSection] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<GuideSection>(null)
  const [qaPassedAt, setQaPassedAt]   = useState<string | null>(null)
  const [seoScore, setSeoScore]       = useState(0)
  const timer                         = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (!prospectId) return
    supabase.from('prospects').select('*').eq('id', prospectId).maybeSingle().then(({ data }) => {
      if (data) { setForm(data); if (data.slug) setSlugEdited(true) }
      setLoading(false)
    })
    supabase.from('qa_checklists').select('qa_passed_at').eq('prospect_id', prospectId).maybeSingle()
      .then(({ data }) => { if (data?.qa_passed_at) setQaPassedAt(data.qa_passed_at) })
  }, [prospectId])

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
    const dataToSave = { ...data, business_info: syncedBi }
    let saved_id = id
    if (!saved_id) {
      const { data: row, error } = await supabase.from('prospects').insert({
        ...dataToSave, status: dataToSave.status || 'prospect',
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

  const handleCompanyName = (v: string) => {
    setField('company_name', v)
    if (!slugEdited) setField('slug', slugify(v))
    if (!form.admin_password && v) {
      const word = v.replace(/[^A-Za-z]/g, '').slice(0, 10)
      setField('admin_password', `${word}2026!`)
    }
  }

  const wrappedSetField = useCallback((k: string, v: any) => {
    if (k === 'company_name') handleCompanyName(v)
    else if (k === 'slug') { setSlugEdited(true); setField('slug', v) }
    else setField(k, v)
  }, [form, setField, slugEdited]) // eslint-disable-line

  const onUpdate = useCallback((updates: Partial<Prospect>) => {
    setForm(f => ({ ...f, ...updates }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
      const updates: Partial<Prospect> = { business_info: bi }
      if (data.business_name)       updates.company_name    = data.business_name
      if (data.owner_name)          updates.contact_name    = data.owner_name
      if (data.phone)               updates.phone           = data.phone
      if (data.email)               updates.email           = data.email
      if (data.facebook_url)        updates.social_facebook = data.facebook_url
      if (data.instagram_handle)    updates.social_instagram = data.instagram_handle
      if (data.google_business_url) updates.social_google   = data.google_business_url
      if (data.services?.length)      console.log('[scrape] services:', data.services)
      if (data.service_areas?.length) console.log('[scrape] service_areas:', data.service_areas)
      return { ...f, ...updates }
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

  async function saveTier(val: string) {
    setField('tier', val)
    if (!id) return
    await supabase.from('prospects').update({ tier: val }).eq('id', id)
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  async function handleArchive() {
    if (!id) return
    await archiveRecord('prospects', id, supabase)
    if (form.tenant_id) await archiveRecord('tenants', form.tenant_id, supabase)
    onArchived?.(id, form.company_name || 'Prospect', form.tenant_id ?? undefined)
    onClose(true)
  }

  if (loading) return null

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={() => onClose(true)}>
      <RepGuideDrawer section={guideSection} onClose={() => setGuideSection(null)} />
      <div
        className="w-full max-w-4xl bg-gray-950 border-l border-gray-800 h-full flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 z-10 px-5 py-3 bg-gray-950 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="font-bold text-white truncate">{form.company_name || 'New Prospect'}</h2>
              {TIER_META[((form.tier || 'growth') as keyof typeof TIER_META)] && (() => {
                const t = TIER_META[(form.tier || 'growth') as keyof typeof TIER_META]
                return <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full border ${t.badgeCls}`}>{t.label} · {t.price}</span>
              })()}
            </div>
            <div className="flex items-center gap-3">
              {saved && <span className="text-xs text-emerald-400">✓ Saved</span>}
              <RepGuideButton section="faq" label="? Client FAQ" onOpen={setGuideSection} />
              <button onClick={() => onClose(true)} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {(Object.entries(TIER_META) as [string, typeof TIER_META[keyof typeof TIER_META]][]).map(([key, meta]) => {
              const active = (form.tier || 'growth') === key
              return (
                <button key={key} onClick={() => saveTier(key)}
                  className={`flex flex-col items-center px-3 py-1 text-xs rounded-lg border transition leading-tight ${
                    active ? meta.activeCls : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}>
                  <span className="font-semibold">{meta.label}</span>
                  <span className="opacity-70">{meta.price}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Body — two columns on desktop */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left column: form fields */}
          <div className="flex-[3] overflow-y-auto p-5 space-y-6">

            {/* Pipeline Stage */}
            {id && (
              <PipelineStage
                prospectId={id}
                stage={form.pipeline_stage ?? 'lead_closed'}
                qaPassedAt={qaPassedAt}
                companyName={form.company_name ?? undefined}
                buildPath={form.build_path ?? null}
                onChanged={stage => setForm(f => ({ ...f, pipeline_stage: stage }))}
              />
            )}

            {/* 1. Business Info */}
            <div onFocus={() => setActiveSection('business_info')}>
              <InlineGuide section="business_info" activeSection={activeSection} />
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <a href="https://outlook.office.com/book/PestFlowProOnboarding@ironwoodoperationsgroup.com/?ismsaljsauthenabled"
                  target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition">
                  📅 Book Call
                </a>
                <a href="https://teams.microsoft.com/l/meeting/new"
                  target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition">
                  🎥 Teams Call
                </a>
                <div className="ml-auto"><RepGuideButton section="sales-call" onOpen={setGuideSection} /></div>
              </div>
              <ContactSection form={form} setField={wrappedSetField} onBlur={onBlur} salespeople={salespeople} />
            </div>

            {/* 2. Build Path */}
            {id && (
              <div onFocus={() => setActiveSection('build_path')}>
                <InlineGuide section="build_path" activeSection={activeSection} />
                <BuildPathSelector
                  prospectId={id}
                  buildPath={form.build_path ?? null}
                  customScopeNotes={form.custom_scope_notes ?? null}
                  onChanged={(path, notes) => setForm(f => ({
                    ...f, build_path: path,
                    ...(notes !== undefined ? { custom_scope_notes: notes } : {}),
                  }))}
                />
              </div>
            )}

            {/* 3 & 4. Package & Payment + Social Media */}
            <CollapsibleSection
              title="Package & Payment"
              isComplete={!!form.setup_invoice_sent_at}
              completedLabel={form.setup_invoice_sent_at ? `Invoice sent ${formatDate(form.setup_invoice_sent_at)}` : undefined}
            >
              <div className="flex justify-end mb-2">
                <RepGuideButton section="invoice" onOpen={setGuideSection} />
              </div>
              <OnboardingSection
                form={form}
                setField={wrappedSetField}
                onBlur={onBlur}
                prospect={form}
                onUpdate={onUpdate}
                onFocusSection={s => setActiveSection(s)}
              />
            </CollapsibleSection>

            {/* Build Status */}
            {id && (
              <CollapsibleSection title="Build Status" defaultOpen={true}>
                <BuildStatusWidget
                  prospectId={id}
                  buildPath={form.build_path ?? null}
                  pipelineStage={form.pipeline_stage ?? 'lead_closed'}
                />
              </CollapsibleSection>
            )}

            {/* Claude Context Download + Build Guide — full_custom builds only */}
            {id && form.build_path === 'full_custom' && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-200 border-b border-gray-700 pb-1">Build Files</h3>
                <ClaudeContextDownload
                  prospectId={id}
                  slug={form.slug ?? null}
                  websiteUrl={form.website_url ?? null}
                />
                <FullCustomBuildGuide slug={form.slug ?? null} />
              </div>
            )}

            {/* Redirect Map — Pro/Elite with firecrawl_migration or full_custom builds */}
            {id && (form.tier === 'pro' || form.tier === 'elite') &&
             (form.build_path === 'firecrawl_migration' || form.build_path === 'full_custom') && (
              <CollapsibleSection
                title="301 Redirect Map"
                isComplete={!!form.redirect_map_complete}
                completedLabel="Redirect map complete"
                defaultOpen={!form.redirect_map_complete}
              >
                <RedirectMapPanel
                  prospectId={id}
                  tenantId={form.tenant_id ?? null}
                  redirectMap={form.redirect_map ?? []}
                  redirectMapComplete={!!form.redirect_map_complete}
                  sourceUrl={form.source_url ?? null}
                  onUpdated={(patch) => setForm(f => ({ ...f, ...patch }))}
                />
              </CollapsibleSection>
            )}

            {/* SEO Health Panel */}
            {id && (
              <CollapsibleSection
                title="SEO Health"
                isComplete={seoScore >= 7}
                completedLabel={seoScore > 0 ? `Score ${seoScore}/12` : undefined}
                defaultOpen={seoScore < 7}
              >
                <SEOHealthPanel
                  tenantId={form.tenant_id ?? null}
                  onScoreChange={setSeoScore}
                />
              </CollapsibleSection>
            )}

            {/* QA Gate */}
            {id && (
              <CollapsibleSection
                title="QA Checklist"
                isComplete={!!qaPassedAt}
                completedLabel={qaPassedAt ? `QA passed ${formatDate(qaPassedAt)}` : undefined}
                defaultOpen={!qaPassedAt}
              >
                <QAGate
                  prospectId={id}
                  pipelineStage={form.pipeline_stage ?? 'lead_closed'}
                  companyName={form.company_name ?? ''}
                  tenantId={form.tenant_id ?? null}
                  tier={form.tier ?? null}
                  buildPath={form.build_path ?? null}
                  redirectMapComplete={!!form.redirect_map_complete}
                  onRevealReady={passedAt => {
                    setQaPassedAt(passedAt)
                    setForm(f => ({ ...f, pipeline_stage: 'reveal_ready' }))
                  }}
                />
              </CollapsibleSection>
            )}

            {/* Onboarding Timeline */}
            {id && (
              <CollapsibleSection title="Onboarding Progress" isComplete={true} defaultOpen={false}>
                <OnboardingTimeline prospect={form} />
              </CollapsibleSection>
            )}

            {/* 5. Remaining — Intake, Scrape, Site Setup, Provision */}
            <div className="border-t border-gray-800 pt-4 space-y-6">
              <CollapsibleSection
                title="Intake Link"
                isComplete={!!form.intake_submitted_at}
                isLocked={!!form.intake_submitted_at}
                completedLabel={form.intake_submitted_at ? `Submitted ${formatDate(form.intake_submitted_at)}` : undefined}
                defaultOpen={!form.intake_submitted_at}
              >
                <div className="flex justify-end mb-2">
                  <RepGuideButton section="intake" onOpen={setGuideSection} />
                </div>
                <IntakeLinkSection
                  prospectId={id}
                  adminEmail={form.admin_email ?? undefined}
                  companyName={form.company_name ?? undefined}
                  onImportSuccess={(data) => setForm(data)}
                />
              </CollapsibleSection>
              {(!form.build_path || form.build_path !== 'template_launch') && (
                <ScrapePanel
                  sourceUrl={form.website_url || ''}
                  onSourceUrlChange={v => { wrappedSetField('website_url', v); onBlur() }}
                  prospectId={id}
                  onApplyScraped={onApplyScraped}
                  onApplyRecreation={onApplyRecreation}
                  tier={form.tier ?? null}
                  form={form}
                />
              )}
              <div className="flex items-center justify-end gap-2">
                <RepGuideButton section="prospect-fields" onOpen={setGuideSection} />
                <RepGuideButton section="shell-palette" onOpen={setGuideSection} />
              </div>
              {(!form.build_path || form.build_path !== 'firecrawl_migration') && (
                <SiteSetupSection form={form} setField={wrappedSetField} onBlur={onBlur} />
              )}

              <IntegrationsSection prospectId={id} form={form} />
              <div className="flex justify-end">
                <RepGuideButton section={form.provisioned_at ? 'post-launch' : 'pre-provision'} label={form.provisioned_at ? '? Post-Launch Guide' : undefined} onOpen={setGuideSection} />
              </div>
              <ProvisionSection form={form} prospectId={id} onProvisioned={onUpdate} />
              {form.tenant_id && form.slug && (
                <div className="space-y-3">
                  <CustomDomainSetup tenantId={form.tenant_id} slug={form.slug} />
                  <BundleSocialSetup tenantId={form.tenant_id} />
                </div>
              )}
            </div>

            {/* Activity Log */}
            {id && <ActivityLog prospectId={id} />}

            {id && (
              <div className="pt-2 border-t border-gray-800">
                <button onClick={handleArchive}
                  className="text-xs text-yellow-500 hover:text-yellow-400 transition">
                  Archive Client
                </button>
              </div>
            )}
          </div>

          {/* Right column: contextual guide (desktop only) */}
          <div className="hidden md:flex flex-[2] overflow-y-auto border-l border-gray-800 bg-gray-900/30">
            <ProspectFormGuide activeSection={activeSection} />
          </div>

        </div>
      </div>
    </div>
  )
}
