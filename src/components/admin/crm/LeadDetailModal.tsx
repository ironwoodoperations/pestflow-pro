import { X, Mail, Phone } from 'lucide-react'
import type { Lead } from './types'
import { STATUSES, STATUS_BADGE } from './types'

interface Props {
  lead: Lead
  onClose: () => void
  onStatusChange: (id: string, status: string) => void
}

export default function LeadDetailModal({ lead, onClose, onStatusChange }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Lead Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div><p className="text-xs text-gray-500 uppercase tracking-wider">Name</p><p className="text-gray-900 font-medium">{lead.name}</p></div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
            <a href={`mailto:${lead.email}?subject=Following up on your quote request&body=Hi ${encodeURIComponent(lead.name)},%0A%0A`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              title={`Email ${lead.name}`}>
              <Mail size={11} /> {lead.email}
            </a>
          </div>
          {lead.phone && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Phone</p>
              <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                <Phone size={11} /> {lead.phone}
              </a>
            </div>
          )}
          <div><p className="text-xs text-gray-500 uppercase tracking-wider">Services</p><p className="text-gray-700">{Array.isArray(lead.services) ? lead.services.join(', ') : (lead.services || '—')}</p></div>
          <div><p className="text-xs text-gray-500 uppercase tracking-wider">Message</p><p className="text-gray-700 whitespace-pre-wrap">{lead.message || '—'}</p></div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Status</p>
            <select value={lead.status || 'new'} onChange={e => onStatusChange(lead.id, e.target.value)}
              className={`px-2 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-emerald-500 cursor-pointer ${STATUS_BADGE[lead.status || 'new']}`}>
              {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div><p className="text-xs text-gray-500 uppercase tracking-wider">Submitted</p><p className="text-gray-700">{new Date(lead.created_at).toLocaleString()}</p></div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium">Close</button>
        </div>
      </div>
    </div>
  )
}
