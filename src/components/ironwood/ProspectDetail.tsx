import type { Salesperson } from './types'
import { useProspectDetail }   from './useProspectDetail'
import ContactSection          from './ProspectDetail.Contact'
import ProspectSections        from './ProspectDetail.Sections'
import ActivityLog             from './ActivityLog'
import RepGuideButton          from './RepGuideButton'
import RepGuideDrawer          from './RepGuideDrawer'
import PipelineStage           from './PipelineStage'
import ProspectFormGuide, { InlineGuide } from './ProspectFormGuide'

const TIER_META = {
  starter: { label: 'Starter', price: '$149/mo', badgeCls: 'bg-gray-800 text-gray-400 border-gray-600',         activeCls: 'bg-gray-600 border-gray-400 text-white' },
  growth:  { label: 'Growth',  price: '$249/mo', badgeCls: 'bg-blue-900/60 text-blue-300 border-blue-700',      activeCls: 'bg-blue-700 border-blue-500 text-white' },
  pro:     { label: 'Pro',     price: '$349/mo', badgeCls: 'bg-indigo-900/60 text-indigo-300 border-indigo-700', activeCls: 'bg-indigo-700 border-indigo-500 text-white' },
  elite:   { label: 'Elite',   price: '$499/mo', badgeCls: 'bg-amber-900/60 text-amber-300 border-amber-700',   activeCls: 'bg-amber-700 border-amber-500 text-white' },
} as const

interface Props {
  prospectId: string | null
  salespeople: Salesperson[]
  onClose: (refreshed?: boolean) => void
  onArchived?: (id: string, name: string, tenantId?: string) => void
}

export default function ProspectDetail({ prospectId, salespeople, onClose, onArchived }: Props) {
  const {
    form, id, saved, loading,
    wrappedSetField, onBlur,
    onUpdate, onProvisioned, onApplyScraped, onApplyRecreation,
    saveTier, handleArchive,
    openSection, setOpenSection,
    guideSection, setGuideSection,
    activeSection, setActiveSection,
    qaPassedAt, setQaPassedAt,
    setSeoScore,
  } = useProspectDetail(prospectId, onClose, onArchived)

  if (loading) return null

  const tierKey = (form.tier || 'growth') as keyof typeof TIER_META
  const tier = TIER_META[tierKey]

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={() => onClose(true)}>
      <RepGuideDrawer section={guideSection} onClose={() => setGuideSection(null)} />
      <div className="w-full max-w-4xl bg-gray-950 border-l border-gray-800 h-full flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* ── Always-visible header ─────────────────────────────────── */}
        <div className="shrink-0 z-10 px-5 py-3 bg-gray-950 border-b border-gray-800 space-y-2">

          {/* Row 1: name + tier badge + controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="font-bold text-white truncate">{form.company_name || 'New Prospect'}</h2>
              {tier && <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full border ${tier.badgeCls}`}>{tier.label}</span>}
            </div>
            <div className="flex items-center gap-3">
              {saved && <span className="text-xs text-emerald-400">✓ Saved</span>}
              <RepGuideButton section="faq" label="? Client FAQ" onOpen={setGuideSection} />
              <button onClick={() => onClose(true)} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
            </div>
          </div>

          {/* Row 2: tier selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(Object.entries(TIER_META) as [string, typeof TIER_META[keyof typeof TIER_META]][]).map(([key, meta]) => (
              <button key={key} onClick={() => saveTier(key)}
                className={`flex flex-col items-center px-3 py-1 text-xs rounded-lg border transition leading-tight ${
                  (form.tier || 'growth') === key ? meta.activeCls : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500'
                }`}>
                <span className="font-semibold">{meta.label}</span>
                <span className="opacity-70">{meta.price}</span>
              </button>
            ))}
          </div>

          {/* Row 3: pipeline stage stepper */}
          {id && (
            <PipelineStage
              prospectId={id} stage={form.pipeline_stage ?? 'lead_closed'} qaPassedAt={qaPassedAt}
              onChanged={stage => onUpdate({ pipeline_stage: stage })}
            />
          )}

          {/* Row 4: action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <a href="https://outlook.office.com/book/PestFlowProOnboarding@ironwoodoperationsgroup.com/?ismsaljsauthenabled"
              target="_blank" rel="noopener noreferrer"
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition">📅 Book Call</a>
            <a href="https://teams.microsoft.com/l/meeting/new" target="_blank" rel="noopener noreferrer"
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition">🎥 Teams Call</a>
            <RepGuideButton section="sales-call" onOpen={setGuideSection} />
          </div>
        </div>

        {/* ── Body ─────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left: contact (always visible) + accordion + activity log */}
          <div className="flex-[3] overflow-y-auto p-5 space-y-4">
            <div onFocus={() => setActiveSection('business_info')}>
              <InlineGuide section="business_info" activeSection={activeSection} />
              <ContactSection form={form} setField={wrappedSetField} onBlur={onBlur} salespeople={salespeople} />
            </div>

            <ProspectSections
              id={id}
              form={form}
              openSection={openSection}
              setOpenSection={setOpenSection}
              salespeople={salespeople}
              wrappedSetField={wrappedSetField}
              onBlur={onBlur}
              onUpdate={onUpdate}
              onProvisioned={onProvisioned}
              qaPassedAt={qaPassedAt}
              setQaPassedAt={setQaPassedAt}
              setSeoScore={setSeoScore}
              guideSection={guideSection}
              setGuideSection={setGuideSection}
              setActiveSection={setActiveSection}
              onApplyScraped={onApplyScraped}
              onApplyRecreation={onApplyRecreation}
            />

            {/* Activity log — always visible */}
            {id && <ActivityLog prospectId={id} />}

            {id && (
              <div className="pt-2 border-t border-gray-800">
                <button onClick={handleArchive} className="text-xs text-yellow-500 hover:text-yellow-400 transition">
                  Archive Client
                </button>
              </div>
            )}
          </div>

          {/* Right: contextual guide (desktop only) */}
          <div className="hidden md:flex flex-[2] overflow-y-auto border-l border-gray-800 bg-gray-900/30">
            <ProspectFormGuide activeSection={activeSection} />
          </div>
        </div>
      </div>
    </div>
  )
}
