import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import type { FormData } from './types'
import { INPUT_CLASS } from './types'

interface Props {
  form: FormData
  addLocation: () => void
  removeLocation: (i: number) => void
  updateLocation: (i: number, field: 'city' | 'slug', value: string) => void
  onNext: () => void
  onBack: () => void
}

export default function StepLocations({ form, addLocation, removeLocation, updateLocation, onNext, onBack }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Service Locations</h2>
        <p className="text-gray-500 text-sm mt-1">Each city gets its own SEO-optimized landing page. Add up to 6 — you can always add more later.</p>
      </div>
      {form.locations.map((loc, i) => (
        <div key={i} className="flex items-center gap-3">
          <input className={INPUT_CLASS} placeholder="City name (e.g. Tyler)" value={loc.city} onChange={e => updateLocation(i, 'city', e.target.value)} />
          <input className={`${INPUT_CLASS} max-w-[180px]`} placeholder="URL slug (e.g. tyler-tx)" value={loc.slug} onChange={e => updateLocation(i, 'slug', e.target.value)} />
          {form.locations.length > 1 && (
            <button onClick={() => removeLocation(i)} className="text-gray-400 hover:text-red-500 transition p-1"><Trash2 size={18} /></button>
          )}
        </div>
      ))}
      {form.locations.length < 6 && (
        <button onClick={addLocation} className="flex items-center gap-2 text-sm text-emerald-500 hover:text-emerald-600 transition font-medium">
          <Plus size={16} /> Add Another Service Area
        </button>
      )}
      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition text-sm"><ArrowLeft size={16} /> Back</button>
        <div className="flex items-center gap-3">
          <button onClick={onNext} className="text-gray-500 hover:text-gray-700 text-sm transition">Skip for now</button>
          <button onClick={onNext} className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-8 py-3 rounded-lg transition">Next →</button>
        </div>
      </div>
    </div>
  )
}
