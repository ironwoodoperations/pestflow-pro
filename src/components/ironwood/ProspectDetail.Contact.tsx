import type { Prospect, ProspectStatus, Salesperson } from './types'

const STATUSES: ProspectStatus[] = [
  'prospect','quoted','paid','onboarding','provisioned','active','churned',
]
const inp = 'w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500'

interface Props {
  form: Partial<Prospect>
  setField: (k: string, v: any) => void
  onBlur: () => void
  salespeople: Salesperson[]
}

export default function ContactSection({ form, setField, onBlur, salespeople }: Props) {
  const sp = salespeople.find(s => s.id === form.salesperson_id)

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-200 border-b border-gray-700 pb-1">Contact & Pipeline</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-400">Company Name *</label>
          <input className={inp} value={form.company_name || ''}
            onChange={e => setField('company_name', e.target.value)} onBlur={onBlur} />
        </div>
        <div>
          <label className="text-xs text-gray-400">Contact Name</label>
          <input className={inp} value={form.contact_name || ''}
            onChange={e => setField('contact_name', e.target.value)} onBlur={onBlur} />
        </div>
        <div>
          <label className="text-xs text-gray-400">Phone</label>
          <input className={inp} value={form.phone || ''}
            onChange={e => setField('phone', e.target.value)} onBlur={onBlur} />
        </div>
        <div>
          <label className="text-xs text-gray-400">Email</label>
          <input type="email" className={inp} value={form.email || ''}
            onChange={e => setField('email', e.target.value)} onBlur={onBlur} />
        </div>
        <div>
          <label className="text-xs text-gray-400">Salesperson</label>
          <select className={inp} value={form.salesperson_id || ''}
            onChange={e => { setField('salesperson_id', e.target.value || null); onBlur() }}>
            <option value="">— None —</option>
            {salespeople.filter(s => s.active).map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400">Onboarding Rep</label>
          <p className="text-xs text-gray-600 mb-0.5">Flat $100 per completed onboarding</p>
          <select className={inp} value={form.onboarding_rep_id || ''}
            onChange={e => { setField('onboarding_rep_id', e.target.value || null); onBlur() }}>
            <option value="">— None —</option>
            {salespeople.filter(s => s.active).map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400">Status</label>
          <select className={inp} value={form.status || 'prospect'}
            onChange={e => { setField('status', e.target.value); onBlur() }}>
            {STATUSES.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400">Call Date</label>
          <input type="date" className={inp} value={form.call_date || ''}
            onChange={e => setField('call_date', e.target.value)} onBlur={onBlur} />
        </div>
        <div>
          <label className="text-xs text-gray-400">Website URL</label>
          <input className={inp} value={form.website_url || ''}
            onChange={e => setField('website_url', e.target.value)} onBlur={onBlur} />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-400">Notes</label>
        <textarea rows={3} className={`${inp} resize-none`} value={form.notes || ''}
          onChange={e => setField('notes', e.target.value)} onBlur={onBlur} />
      </div>
      {/* Communication buttons */}
      <div className="flex gap-2 flex-wrap">
        {form.phone && (
          <a href={`tel:${form.phone}`} className="px-3 py-1.5 bg-blue-700 text-white text-xs rounded hover:bg-blue-600">📞 Call</a>
        )}
        {form.email && (
          <a href={`mailto:${form.email}`} className="px-3 py-1.5 bg-indigo-700 text-white text-xs rounded hover:bg-indigo-600">✉ Email</a>
        )}
        {form.phone && (
          <a href={`sms:${form.phone}`} className="px-3 py-1.5 bg-green-700 text-white text-xs rounded hover:bg-green-600">💬 Text</a>
        )}
        {sp?.cal_booking_url && (
          <a href={sp.cal_booking_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-orange-700 text-white text-xs rounded hover:bg-orange-600">📅 Book Call</a>
        )}
      </div>
    </div>
  )
}
