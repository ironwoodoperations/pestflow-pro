import { ArrowLeft } from 'lucide-react'
import type { FormData } from './types'
import { INPUT_CLASS } from './types'

interface Props {
  form: FormData
  updateField: <K extends keyof FormData>(key: K, value: FormData[K]) => void
  onNext: () => void
  onBack: () => void
}

export default function StepSocialLinks({ form, updateField, onNext, onBack }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Social Media Links</h2>
        <p className="text-gray-500 text-sm mt-1">Add your social profiles so customers can follow you. All fields are optional — skip any you don't have.</p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Facebook Page URL</label>
        <input className={INPUT_CLASS} value={form.facebook} onChange={e => updateField('facebook', e.target.value)} placeholder="https://facebook.com/yourpage" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Instagram Profile URL</label>
        <input className={INPUT_CLASS} value={form.instagram} onChange={e => updateField('instagram', e.target.value)} placeholder="https://instagram.com/yourhandle" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Google Business Profile URL</label>
        <input className={INPUT_CLASS} value={form.google} onChange={e => updateField('google', e.target.value)} placeholder="https://g.page/yourbusiness" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">YouTube Channel URL</label>
        <input className={INPUT_CLASS} value={form.youtube} onChange={e => updateField('youtube', e.target.value)} placeholder="https://youtube.com/@yourchannel" />
      </div>
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
