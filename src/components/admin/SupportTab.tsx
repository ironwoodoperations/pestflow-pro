import { useState, useEffect } from 'react'
import { LifeBuoy, Plus, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../context/TenantBootProvider'
import PageHelpBanner from './PageHelpBanner'

interface Ticket {
  id: string
  subject: string
  body: string
  priority: string
  status: string
  created_at: string
  admin_reply: string | null
}

const PRIORITY_BADGE: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
}

const EMPTY: Ticket[] = []

export default function SupportTab() {
  const { id: tenantId } = useTenant()
  const [tickets, setTickets] = useState<Ticket[]>(EMPTY)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({ subject: '', body: '', priority: 'normal' })

  useEffect(() => {
    if (!tenantId) return
    supabase
      .from('support_tickets')
      .select('id, subject, body, priority, status, created_at, admin_reply')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setTickets((data as Ticket[]) ?? EMPTY))
  }, [tenantId])

  const handleSubmit = async () => {
    if (!tenantId || !form.subject.trim() || !form.body.trim()) return
    setSubmitting(true)
    const { data, error } = await supabase
      .from('support_tickets')
      .insert({ tenant_id: tenantId, subject: form.subject.trim(), body: form.body.trim(), priority: form.priority })
      .select('id, subject, body, priority, status, created_at, admin_reply')
      .single()
    if (!error && data) {
      setTickets(prev => [data as Ticket, ...prev])
      setShowModal(false)
      setForm({ subject: '', body: '', priority: 'normal' })
      setToast('Ticket submitted — we\'ll be in touch shortly')
      setTimeout(() => setToast(''), 4000)
      // Notify support team
      supabase.auth.getSession().then(({ data: { session } }) => {
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-support-ticket`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token ?? ''}`,
          },
          body: JSON.stringify({ ticketId: (data as Ticket).id }),
        }).catch(() => {})
      })
    }
    setSubmitting(false)
  }

  return (
    <div>
      <PageHelpBanner tab="support" title="🎟️ Support" body="Submit a request to the PestFlow Pro team. We'll respond within 1 business day." />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <LifeBuoy size={16} />
          <span>{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus size={16} /> New Ticket
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
          No support tickets yet. Use "New Ticket" to contact the PestFlow Pro team.
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_BADGE[t.priority] ?? PRIORITY_BADGE.normal}`}>
                      {t.priority}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[t.status] ?? STATUS_BADGE.open}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-800 text-sm">{t.subject}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.body}</p>
                  {t.admin_reply && (
                    <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-700 mb-1">PestFlow Pro replied:</p>
                      <p className="text-xs text-emerald-800">{t.admin_reply}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">New Support Ticket</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Brief description of your issue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  rows={4}
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="Describe the issue in detail..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !form.subject.trim() || !form.body.trim()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
              >
                {submitting ? 'Submitting…' : 'Submit Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-3 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
