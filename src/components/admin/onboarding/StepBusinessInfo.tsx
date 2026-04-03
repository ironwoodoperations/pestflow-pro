import { ArrowLeft } from 'lucide-react'
import type { FormData } from './types'
import { INPUT_CLASS } from './types'

interface Props {
  form: FormData
  updateField: <K extends keyof FormData>(key: K, value: FormData[K]) => void
  onNext: () => void
  onBack: () => void
}

export default function StepBusinessInfo({ form, updateField, onNext, onBack }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Business Information</h2>
        <p className="text-gray-500 text-sm mt-1">This is how customers will find and contact you. It appears on every page of your website.</p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Business Name *</label>
        <input className={INPUT_CLASS} value={form.businessName} onChange={e => updateField('businessName', e.target.value)} placeholder="Apex Pest Solutions" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
          <input className={INPUT_CLASS} value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="(903) 555-0100" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
          <input className={INPUT_CLASS} type="email" value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="info@apexpest.com" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Street Address</label>
        <input className={INPUT_CLASS} value={form.address} onChange={e => updateField('address', e.target.value)} placeholder="123 Main St, Tyler, TX 75701" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Business Hours</label>
        <input className={INPUT_CLASS} value={form.hours} onChange={e => updateField('hours', e.target.value)} placeholder="Mon–Fri 8am–6pm, Sat 9am–3pm" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tagline</label>
          <input className={INPUT_CLASS} value={form.tagline} onChange={e => updateField('tagline', e.target.value)} placeholder="Your local pest experts" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">License Number</label>
          <input className={INPUT_CLASS} value={form.license} onChange={e => updateField('license', e.target.value)} placeholder="TPCL-12345" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Industry</label>
        <input className={INPUT_CLASS} value={form.industry} onChange={e => updateField('industry', e.target.value)} placeholder="e.g. Pest Control, HVAC, Plumbing" />
        <p className="text-xs text-gray-400 mt-1">This customizes AI captions and social media content for your industry.</p>
      </div>
      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition text-sm"><ArrowLeft size={16} /> Back</button>
        <button onClick={onNext} className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-8 py-3 rounded-lg transition">Next →</button>
      </div>
    </div>
  )
}
