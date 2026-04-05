import { ArrowLeft } from 'lucide-react'
import type { FormData } from './types'

interface Props {
  form: FormData
  saving: boolean
  onLaunch: () => void
  onBack: () => void
  goToStep: (n: number) => void
  updateField: <K extends keyof FormData>(key: K, value: FormData[K]) => void
}

export default function StepReview({ form, saving, onLaunch, onBack, goToStep, updateField }: Props) {
  const allAccepted = form.acceptedTerms && form.acceptedPrivacy && form.acceptedDataUse

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Review & Launch</h2>
        <p className="text-gray-500 text-sm mt-1">Everything look good? You can change any of this later from your admin dashboard.</p>
      </div>
      <div className="bg-[#f8fafc] rounded-xl p-6 border border-gray-100 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Business</p>
            <p className="text-gray-900 font-semibold text-lg">{form.businessName || '—'}</p>
            {form.phone && <p className="text-gray-500 text-sm">{form.phone}</p>}
            {form.email && <p className="text-gray-500 text-sm">{form.email}</p>}
            {form.address && <p className="text-gray-500 text-sm">{form.address}</p>}
            {form.hours && <p className="text-gray-500 text-sm">{form.hours}</p>}
            {form.tagline && <p className="text-gray-400 text-sm italic mt-1">"{form.tagline}"</p>}
          </div>
          <button onClick={() => goToStep(2)} className="text-emerald-600 text-sm font-medium hover:underline">Edit</button>
        </div>
        <div className="border-t border-gray-100 pt-4 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Social Links</p>
            {[form.facebook, form.instagram, form.google, form.youtube].some(Boolean) ? (
              <p className="text-gray-600 text-sm">{[form.facebook && 'Facebook', form.instagram && 'Instagram', form.google && 'Google', form.youtube && 'YouTube'].filter(Boolean).join(', ')}</p>
            ) : (
              <p className="text-gray-400 text-sm">None added — you can add them later</p>
            )}
          </div>
          <button onClick={() => goToStep(3)} className="text-emerald-600 text-sm font-medium hover:underline">Edit</button>
        </div>
        <div className="border-t border-gray-100 pt-4 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Branding</p>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-8 h-8 rounded-lg shadow-sm border" style={{ backgroundColor: form.primaryColor }} />
              <div className="w-8 h-8 rounded-lg shadow-sm border" style={{ backgroundColor: form.accentColor }} />
              <span className="text-gray-600 text-sm capitalize font-medium">{form.template} template</span>
            </div>
          </div>
          <button onClick={() => goToStep(4)} className="text-emerald-600 text-sm font-medium hover:underline">Edit</button>
        </div>
        <div className="border-t border-gray-100 pt-4 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Locations</p>
            {form.locations.filter(l => l.city).length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-1">
                {form.locations.filter(l => l.city).map((l, i) => (
                  <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">{l.city}</span>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No locations added — you can add them later</p>
            )}
          </div>
          <button onClick={() => goToStep(5)} className="text-emerald-600 text-sm font-medium hover:underline">Edit</button>
        </div>
      </div>

      {/* Legal acceptance */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
        <p className="text-sm font-semibold text-amber-800">Before launching, please confirm the following:</p>
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="acceptedTerms"
            checked={form.acceptedTerms}
            onChange={e => updateField('acceptedTerms', e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          <label htmlFor="acceptedTerms" className="text-sm text-slate-700">
            I have read and agree to the PestFlow Pro{' '}
            <a href="https://pestflow-pro.vercel.app/terms" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-medium">
              Terms of Service &amp; License Agreement
            </a>
          </label>
        </div>
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="acceptedPrivacy"
            checked={form.acceptedPrivacy}
            onChange={e => updateField('acceptedPrivacy', e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          <label htmlFor="acceptedPrivacy" className="text-sm text-slate-700">
            I have read and understand the{' '}
            <a href="https://pestflow-pro.vercel.app/privacy" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-medium">
              Privacy Policy
            </a>
          </label>
        </div>
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="acceptedDataUse"
            checked={form.acceptedDataUse}
            onChange={e => updateField('acceptedDataUse', e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          <label htmlFor="acceptedDataUse" className="text-sm text-slate-700">
            I understand that my subscription will continue on a month-to-month basis until cancelled with 30 days written notice, and that any setup fee is non-refundable.
          </label>
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition text-sm"><ArrowLeft size={16} /> Back</button>
        <button
          onClick={onLaunch}
          disabled={saving || !allAccepted}
          className={`font-semibold px-10 py-4 rounded-lg transition text-lg text-white ${allAccepted ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-600 opacity-50 cursor-not-allowed'}`}
        >
          {saving ? 'Launching...' : 'Launch My Site 🚀'}
        </button>
      </div>
    </div>
  )
}
