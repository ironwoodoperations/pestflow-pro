import type { Dispatch, SetStateAction } from 'react'
import type { Prospect, Salesperson } from './types'
import type { GuideSection } from './ProspectFormGuide'
import type { ScrapedData } from './ScrapePanel'
import type { SiteRecreation } from './SiteRecreationCard'

import CollapsibleSection  from './CollapsibleSection'
import BuildPathSelector   from './BuildPathSelector'
import BuildStatusWidget   from './BuildStatusWidget'
import ScrapePanel         from './ScrapePanel'
import FullCustomBuildGuide  from './FullCustomBuildGuide'
import RedirectMapPanel    from './RedirectMapPanel'
import OnboardingSection   from './ProspectDetail.Onboarding'
import IntakeLinkSection   from './ProspectDetail.IntakeLink'
import SiteContentSection  from './ProspectDetail.SiteContent'
import BrandingSection     from './ProspectDetail.Branding'
import IntegrationsSection from './ProspectDetail.Integrations'
import SiteSetupSection    from './ProspectDetail.SiteSetup'
import ProvisionSection    from './ProspectDetail.Provisioning'
import QAGate              from './QAGate'
import SEOHealthPanel      from './SEOHealthPanel'
import PageSpeedSection    from './ProspectDetail.PageSpeed'
import CustomDomainSetup   from './CustomDomainSetup'
import BundleSocialSetup   from './BundleSocialSetup'
import RepGuideButton      from './RepGuideButton'

function fmt(d: string | null | undefined) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface AccProps {
  id: string; title: string; children: React.ReactNode
  openSection: string | null; setOpenSection: Dispatch<SetStateAction<string | null>>
  isComplete?: boolean; completedLabel?: string; isLocked?: boolean
}

function Acc({ id, title, children, openSection, setOpenSection, isComplete, completedLabel, isLocked }: AccProps) {
  return (
    <CollapsibleSection
      title={title}
      open={openSection === id}
      onToggle={() => setOpenSection(prev => prev === id ? null : id)}
      isComplete={isComplete}
      completedLabel={completedLabel}
      isLocked={isLocked}
    >
      {children}
    </CollapsibleSection>
  )
}

interface Props {
  id: string | null
  form: Partial<Prospect>
  openSection: string | null
  setOpenSection: Dispatch<SetStateAction<string | null>>
  salespeople: Salesperson[]
  wrappedSetField: (k: string, v: any) => void
  onBlur: () => void
  onUpdate: (updates: Partial<Prospect>) => void
  onProvisioned: (updates: Partial<Prospect>) => void
  qaPassedAt: string | null
  setQaPassedAt: (v: string | null) => void
  setSeoScore: (v: number) => void
  guideSection: string | null
  setGuideSection: (v: string | null) => void
  setActiveSection: (v: GuideSection) => void
  onApplyScraped: (data: Partial<ScrapedData>) => void
  onApplyRecreation: (data: SiteRecreation) => void
}

export default function ProspectSections({ id, form, openSection, setOpenSection, wrappedSetField, onBlur, onUpdate, onProvisioned, qaPassedAt, setQaPassedAt, setSeoScore, setGuideSection, setActiveSection, onApplyScraped, onApplyRecreation }: Props) {
  const acc = { openSection, setOpenSection }

  return (
    <div className="space-y-2">

      {/* 1. Build Path */}
      <Acc id="build_path" title="Build Path" isComplete={!!form.build_path} completedLabel={form.build_path ? `Build path: ${form.build_path.replace(/_/g, ' ')}` : undefined} {...acc}>
        {id ? (
          <div className="space-y-4">
            <BuildPathSelector
              prospectId={id} buildPath={form.build_path ?? null} customScopeNotes={form.custom_scope_notes ?? null}
              onChanged={(path, notes) => onUpdate({ build_path: path, ...(notes !== undefined ? { custom_scope_notes: notes } : {}) })}
            />
            <BuildStatusWidget prospectId={id} buildPath={form.build_path ?? null} pipelineStage={form.pipeline_stage ?? 'lead_closed'} />
            {(!form.build_path || form.build_path !== 'template_launch') && (
              <ScrapePanel sourceUrl={form.website_url || ''} onSourceUrlChange={v => { wrappedSetField('website_url', v); onBlur() }}
                prospectId={id} onApplyScraped={onApplyScraped} onApplyRecreation={onApplyRecreation} tier={form.tier ?? null} form={form} />
            )}
            {form.build_path === 'full_custom' && (
              <div className="space-y-2">
                <FullCustomBuildGuide slug={form.slug ?? null} />
              </div>
            )}
            {(form.tier === 'pro' || form.tier === 'elite') && (form.build_path === 'firecrawl_migration' || form.build_path === 'full_custom') && (
              <RedirectMapPanel prospectId={id} tenantId={form.tenant_id ?? null} redirectMap={form.redirect_map ?? []}
                redirectMapComplete={!!form.redirect_map_complete} sourceUrl={form.source_url ?? null}
                onUpdated={patch => onUpdate(patch)} />
            )}
          </div>
        ) : <p className="text-xs text-gray-500">Save the prospect first to select a build path.</p>}
      </Acc>

      {/* 2. Plan & Payment */}
      <Acc id="package_payment" title="Plan & Payment" isComplete={!!form.setup_invoice_sent_at} completedLabel={form.setup_invoice_sent_at ? `Invoice sent ${fmt(form.setup_invoice_sent_at)}` : undefined} {...acc}>
        <div className="flex justify-end mb-2"><RepGuideButton section="invoice" onOpen={setGuideSection} /></div>
        <OnboardingSection form={form} setField={wrappedSetField} onBlur={onBlur} prospect={form} onUpdate={onUpdate} onFocusSection={s => setActiveSection(s as any)} />
      </Acc>

      {/* 3. Intake Link */}
      <Acc id="intake_link" title="Intake Link" isComplete={!!form.intake_submitted_at} isLocked={!!form.intake_submitted_at} completedLabel={form.intake_submitted_at ? `Submitted ${fmt(form.intake_submitted_at)}` : undefined} {...acc}>
        <div className="flex justify-end mb-2"><RepGuideButton section="intake" onOpen={setGuideSection} /></div>
        <IntakeLinkSection prospectId={id} adminEmail={form.email ?? undefined} companyName={form.company_name ?? undefined} onImportSuccess={data => onUpdate(data as Partial<Prospect>)} />
      </Acc>

      {/* 4. Site Content */}
      <Acc id="site_content" title="Site Content" isComplete={!!((form.business_info as any)?.address && (form.business_info as any)?.hours)} completedLabel={(form.business_info as any)?.address ? 'Content fields filled' : undefined} {...acc}>
        <SiteContentSection form={form} setField={wrappedSetField} onBlur={onBlur} />
      </Acc>

      {/* 5. Branding */}
      <Acc id="branding" title="Branding" isComplete={!!((form.branding as any)?.template && ((form.branding as any)?.primary_color || (form.branding as any)?.palette_id))} completedLabel={(form.branding as any)?.template ? `Template: ${(form.branding as any).template.replace(/-/g, ' ')}` : undefined} {...acc}>
        <BrandingSection form={form} setField={wrappedSetField} onBlur={onBlur} />
      </Acc>

      {/* 7. Site Setup & Provision */}
      <Acc id="site_provision" title="Site Setup & Provision" isComplete={!!form.provisioned_at} completedLabel={form.provisioned_at ? `Provisioned ${fmt(form.provisioned_at)}` : undefined} {...acc}>
        <div className="flex justify-end mb-2">
          <RepGuideButton section={form.provisioned_at ? 'post-launch' : 'pre-provision'} label={form.provisioned_at ? '? Post-Launch Guide' : undefined} onOpen={setGuideSection} />
        </div>
        {(!form.build_path || form.build_path !== 'firecrawl_migration') && (
          <div className="mb-4"><SiteSetupSection form={form} setField={wrappedSetField} onBlur={onBlur} /></div>
        )}
        <ProvisionSection form={form} prospectId={id} onProvisioned={onProvisioned} />
        {form.tenant_id && form.slug && (
          <div className="mt-4 space-y-3">
            <CustomDomainSetup tenantId={form.tenant_id} slug={form.slug} />
            <BundleSocialSetup tenantId={form.tenant_id} />
          </div>
        )}
      </Acc>

      {/* 8. Integrations */}
      <Acc id="integrations" title="Integrations" {...acc}>
        <IntegrationsSection prospectId={id} form={form} />
      </Acc>

      {/* 9. QA Checklist */}
      {id && (
        <Acc id="qa_checklist" title="QA Checklist" isComplete={!!qaPassedAt} completedLabel={qaPassedAt ? `QA passed ${fmt(qaPassedAt)}` : undefined} {...acc}>
          <div className="space-y-4">
            <SEOHealthPanel tenantId={form.tenant_id ?? null} onScoreChange={setSeoScore} />
            <QAGate prospectId={id} pipelineStage={form.pipeline_stage ?? 'lead_closed'} companyName={form.company_name ?? ''}
              tenantId={form.tenant_id ?? null} tier={form.tier ?? null} buildPath={form.build_path ?? null}
              redirectMapComplete={!!form.redirect_map_complete}
              onRevealReady={passedAt => { setQaPassedAt(passedAt); onUpdate({ pipeline_stage: 'reveal_ready' }) }} />
          </div>
        </Acc>
      )}

      {/* 10. PageSpeed */}
      {id && (
        <Acc id="pagespeed" title="PageSpeed" {...acc}>
          <PageSpeedSection prospectId={id} slug={form.slug ?? null} form={form} onUpdate={onUpdate} />
        </Acc>
      )}

    </div>
  )
}
