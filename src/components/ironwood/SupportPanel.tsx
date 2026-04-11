import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Ticket {
  id: string
  tenant_id: string
  subject: string
  body: string
  priority: string
  status: string
  created_at: string
  admin_reply: string | null
  resolved_at: string | null
  tenants?: { name: string; slug: string }
}

type Filter = 'all' | 'open' | 'in_progress' | 'resolved'

const PRIORITY_BADGE: Record<string, string> = {
  low: 'bg-gray-700 text-gray-300',
  normal: 'bg-blue-900 text-blue-300',
  high: 'bg-orange-900 text-orange-300',
  urgent: 'bg-red-900 text-red-300',
}

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-yellow-900 text-yellow-300',
  in_progress: 'bg-blue-900 text-blue-300',
  resolved: 'bg-emerald-900 text-emerald-300',
  closed: 'bg-gray-700 text-gray-400',
}

export default function SupportPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const load = async () => {
    const { data } = await supabase
      .from('support_tickets')
      .select('*, tenants(name, slug)')
      .order('created_at', { ascending: false })
    setTickets((data as Ticket[]) ?? [])
  }

  useEffect(() => { load() }, [])

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter)

  const updateStatus = async (id: string, status: string, reply?: string) => {
    setSaving(id)
    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
    if (status === 'resolved') updates.resolved_at = new Date().toISOString()
    if (reply !== undefined) updates.admin_reply = reply
    const { error } = await supabase.from('support_tickets').update(updates).eq('id', id)
    if (!error) {
      setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    }
    setSaving(null)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Support Tickets</h2>
          <p className="text-sm text-gray-400 mt-0.5">{tickets.filter(t => t.status === 'open').length} open</p>
        </div>
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {(['all', 'open', 'in_progress', 'resolved'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${filter === f ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-gray-500 text-sm py-16">No tickets found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => (
            <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <button
                className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-800 transition"
                onClick={() => setExpanded(expanded === t.id ? null : t.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-gray-200 truncate">{t.subject}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400">{t.tenants?.name ?? t.tenant_id}</span>
                    <span className="text-xs text-gray-600">·</span>
                    <span className="text-xs text-gray-500">{t.tenants?.slug}</span>
                    <span className="text-xs text-gray-600">·</span>
                    <span className="text-xs text-gray-500">{new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_BADGE[t.priority] ?? PRIORITY_BADGE.normal}`}>{t.priority}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[t.status] ?? STATUS_BADGE.open}`}>{t.status.replace('_', ' ')}</span>
                </div>
              </button>

              {expanded === t.id && (
                <div className="border-t border-gray-800 px-5 py-4 space-y-4">
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{t.body}</p>

                  {t.admin_reply && (
                    <div className="bg-emerald-900/30 border border-emerald-800 rounded-lg p-3">
                      <p className="text-xs text-emerald-400 font-semibold mb-1">Previous reply:</p>
                      <p className="text-sm text-emerald-200">{t.admin_reply}</p>
                    </div>
                  )}

                  <textarea
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    rows={3}
                    placeholder="Write a reply..."
                    value={replyDraft[t.id] ?? ''}
                    onChange={e => setReplyDraft(d => ({ ...d, [t.id]: e.target.value }))}
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={() => updateStatus(t.id, 'resolved', replyDraft[t.id] ?? t.admin_reply ?? '')}
                      disabled={saving === t.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
                    >
                      {saving === t.id ? 'Saving…' : 'Reply & Resolve'}
                    </button>
                    {t.status === 'open' && (
                      <button
                        onClick={() => updateStatus(t.id, 'in_progress')}
                        disabled={saving === t.id}
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
                      >
                        Mark In Progress
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
