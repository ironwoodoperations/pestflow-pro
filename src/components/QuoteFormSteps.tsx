import type { Dispatch, SetStateAction } from 'react'

export interface QuoteFormState {
  pests: string[]
  propertyType: string
  urgency: string
  address: string
  name: string
  phone: string
  email: string
  referral: string
  message: string
  smsConsent: boolean
  fieldErrors: Record<string, string>
}


const PEST_OPTIONS = [
  'Mosquitoes', 'Spiders', 'Ants', 'Wasps/Hornets', 'Cockroaches',
  'Rodents', 'Termites', 'Bed Bugs', 'Fleas/Ticks', 'Scorpions', 'Other',
]
const PROPERTY_TYPES = ['Single Family Home', 'Apartment/Condo', 'Townhouse', 'Commercial', 'Rental Property', 'Other']
const URGENCY = ['Routine / Not Urgent', 'Within a Week', 'Within 48 Hours', 'Same Day Emergency']
const REFERRAL_OPTIONS = ['Google', 'Facebook', 'Referral', 'Yard Sign', 'Nextdoor', 'Other']

interface Props {
  step: number
  form: QuoteFormState
  setForm: Dispatch<SetStateAction<QuoteFormState>>
  togglePest: (pest: string) => void
  inputClass: string
  businessName: string
}

export default function QuoteFormSteps({ step, form, setForm, togglePest, inputClass, businessName }: Props) {
  return (
    <>
      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">What pests are you dealing with?</h2>
          <p className="text-gray-500 text-sm mb-6">Select all that apply.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PEST_OPTIONS.map(pest => (
              <button key={pest} type="button" role="checkbox" aria-checked={form.pests.includes(pest)} onClick={() => togglePest(pest)}
                className={`px-4 py-3 rounded-lg text-sm font-medium border-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${form.pests.includes(pest) ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                {pest}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Tell us about your property</h2>
          <p className="text-gray-500 text-sm mb-6">This helps us prepare the right treatment plan.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Type *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PROPERTY_TYPES.map(t => (
                  <button key={t} type="button" onClick={() => setForm(p => ({ ...p, propertyType: t }))}
                    className={`px-4 py-3 rounded-lg text-sm font-medium border-2 transition ${form.propertyType === t ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">How urgent is this?</label>
              <div className="grid grid-cols-2 gap-3">
                {URGENCY.map(u => (
                  <button key={u} type="button" onClick={() => setForm(p => ({ ...p, urgency: u }))}
                    className={`px-4 py-3 rounded-lg text-sm font-medium border-2 transition ${form.urgency === u ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Address</label>
              <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="123 Main St, Tyler TX" className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Your contact information</h2>
          <p className="text-gray-500 text-sm mb-6">We'll use this to send your free quote.</p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value, fieldErrors: { ...p.fieldErrors, name: '' } }))} className={inputClass} required />
                {form.fieldErrors.name && <p className="text-red-400 text-sm mt-1">{form.fieldErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value, fieldErrors: { ...p.fieldErrors, phone: '' } }))} className={inputClass} required />
                {form.fieldErrors.phone && <p className="text-red-400 text-sm mt-1">{form.fieldErrors.phone}</p>}
              </div>
            </div>
            <div className="flex items-start gap-3 mt-2">
              <input
                type="checkbox"
                id="sms_consent"
                checked={form.smsConsent}
                onChange={e => setForm(p => ({ ...p, smsConsent: e.target.checked }))}
                className="mt-1 h-4 w-4 rounded border-gray-300 flex-shrink-0"
              />
              <label htmlFor="sms_consent" className="text-xs text-gray-600 leading-relaxed">
                I agree to receive automated text messages from <strong>{businessName}</strong> regarding
                my service request, scheduling updates, and appointment reminders at the phone number
                provided. Message frequency varies. Message and data rates may apply.
                <br /><br />
                By checking this box, you consent to receive recurring automated SMS/MMS messages from{' '}
                <strong>{businessName}</strong>. Consent is not a condition of purchase. You can opt out
                at any time by replying <strong>STOP</strong> to any message. For help, reply{' '}
                <strong>HELP</strong> or contact us. View our{' '}
                <a href="/privacy" className="text-emerald-600 underline">Privacy Policy</a> and{' '}
                <a href="/terms" className="text-emerald-600 underline">Terms of Service</a> for more
                information.
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value, fieldErrors: { ...p.fieldErrors, email: '' } }))} className={inputClass} required />
              {form.fieldErrors.email && <p className="text-red-400 text-sm mt-1">{form.fieldErrors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">How did you hear about us?</label>
              <select value={form.referral} onChange={e => setForm(p => ({ ...p, referral: e.target.value }))} className={inputClass}>
                <option value="">Select...</option>
                {REFERRAL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details</label>
              <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={3} placeholder="Anything else we should know?" className={`${inputClass} resize-none`} />
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Review your request</h2>
          <p className="text-gray-500 text-sm mb-6">Make sure everything looks good before submitting.</p>
          <div className="space-y-4 bg-[#f8fafc] rounded-lg p-5 border border-gray-100">
            <div><p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Pests</p><p className="text-gray-900">{form.pests.join(', ')}</p></div>
            <div><p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Property</p><p className="text-gray-900">{form.propertyType}{form.urgency && ` · ${form.urgency}`}</p></div>
            {form.address && <div><p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Address</p><p className="text-gray-900">{form.address}</p></div>}
            <div><p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Contact</p><p className="text-gray-900">{form.name} · {form.phone} · {form.email}</p></div>
            {form.message && <div><p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Notes</p><p className="text-gray-700">{form.message}</p></div>}
          </div>
        </div>
      )}
    </>
  )
}
