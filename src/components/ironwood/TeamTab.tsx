import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { Salesperson } from './types'

const EMPTY: Partial<Salesperson> = {
  name: '', email: '', phone: '', cal_booking_url: '',
  active: true, commission_setup_pct: 10, commission_recurring_pct: 5,
}

const inp = 'w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white'

export default function TeamTab() {
  const [people, setPeople]       = useState<Salesperson[]>([])
  const [form, setForm]           = useState<Partial<Salesperson> | null>(null)
  const [saving, setSaving]       = useState(false)
  const [isNew, setIsNew]         = useState(false)
  const [inviting, setInviting]   = useState<string | null>(null)
  const [inviteErr, setInviteErr] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)

  const load = async () => {
    const { data } = await supabase.from('salespeople').select('*').order('name')
    if (data) setPeople(data)
  }

  useEffect(() => { load() }, [])

  const sf = (k: keyof Salesperson, v: any) => setForm(f => f ? { ...f, [k]: v } : f)

  const save = async () => {
    if (!form?.name?.trim()) return
    setSaving(true)
    if (isNew) {
      await supabase.from('salespeople').insert({ ...form })
    } else {
      await supabase.from('salespeople').update({ ...form }).eq('id', form.id!)
    }
    setSaving(false)
    setForm(null)
    load()
  }

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('salespeople').update({ active }).eq('id', id)
    load()
  }

  const sendInvite = async (p: Salesperson) => {
    if (!p.email) { setInviteErr('Rep has no email address.'); return }
    setInviting(p.id)
    setInviteErr(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-salesperson`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email: p.email, name: p.name }),
      })
      const data = await res.json()
      if (!data.success) { setInviteErr(data.error || 'Invite failed'); return }
      const now = new Date().toISOString()
      await supabase.from('salespeople').update({ invited_at: now }).eq('id', p.id)
      if (data.invite_url) setInviteUrl(data.invite_url)
      load()
    } catch (e: any) {
      setInviteErr(e.message || 'Network error')
    } finally {
      setInviting(null)
    }
  }

  const BADGE = (active: boolean) =>
    active ? 'bg-green-800 text-green-200' : 'bg-gray-700 text-gray-400'

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Team</h2>
        <button
          onClick={() => { setForm({ ...EMPTY }); setIsNew(true) }}
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-500"
        >
          + Add Rep
        </button>
      </div>

      {/* Modal */}
      {form && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-md p-6 space-y-3">
            <h3 className="font-bold text-white">{isNew ? 'Add Rep' : 'Edit Rep'}</h3>
            <div><label className="text-xs text-gray-400">Name *</label>
              <input className={inp} value={form.name || ''} onChange={e => sf('name', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-400">Email</label>
                <input type="email" className={inp} value={form.email || ''} onChange={e => sf('email', e.target.value)} /></div>
              <div><label className="text-xs text-gray-400">Phone</label>
                <input className={inp} value={form.phone || ''} onChange={e => sf('phone', e.target.value)} /></div>
            </div>
            <div><label className="text-xs text-gray-400">Cal.com Booking URL</label>
              <input className={inp} value={form.cal_booking_url || ''} onChange={e => sf('cal_booking_url', e.target.value)} placeholder="https://cal.com/..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400">One-Time Fee Commission %</label>
                <p className="text-xs text-gray-600 mb-0.5">% of setup fee paid on deal close</p>
                <input type="number" className={inp} value={form.commission_setup_pct ?? 10} onChange={e => sf('commission_setup_pct', parseFloat(e.target.value))} />
              </div>
              <div>
                <label className="text-xs text-gray-400">Monthly Recurring Commission %</label>
                <p className="text-xs text-gray-600 mb-0.5">% of monthly plan, paid each month client is active</p>
                <input type="number" className={inp} value={form.commission_recurring_pct ?? 5} onChange={e => sf('commission_recurring_pct', parseFloat(e.target.value))} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={form.active ?? true} onChange={e => sf('active', e.target.checked)} /> Active
            </label>
            <div className="flex gap-2 pt-2">
              <button onClick={save} disabled={saving} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-500 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setForm(null)} className="px-4 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-600">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {inviteErr && (
        <p className="text-red-400 text-xs bg-red-900/20 border border-red-800 rounded px-3 py-2 mb-3">{inviteErr}</p>
      )}

      {/* Invite URL modal */}
      {inviteUrl && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full space-y-3">
            <h3 className="font-bold text-white">Invite Sent</h3>
            <p className="text-sm text-gray-300">Email invite sent. If they don't receive it, share this link directly:</p>
            <div className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-xs text-emerald-300 break-all">{inviteUrl}</div>
            <div className="flex gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(inviteUrl); }}
                className="px-3 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-500"
              >Copy Link</button>
              <button onClick={() => setInviteUrl(null)} className="px-3 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-600">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-800">
              <th className="pb-2">Name</th><th className="pb-2">Email</th><th className="pb-2">Phone</th>
              <th className="pb-2">Setup %</th><th className="pb-2">Recurring %</th>
              <th className="pb-2">Status</th><th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {people.map(p => (
              <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                <td className="py-2 font-medium text-white">{p.name}</td>
                <td className="py-2 text-gray-300">{p.email || '—'}</td>
                <td className="py-2 text-gray-300">{p.phone || '—'}</td>
                <td className="py-2 text-gray-300">{p.commission_setup_pct}%</td>
                <td className="py-2 text-gray-300">{p.commission_recurring_pct}%</td>
                <td className="py-2"><span className={`text-xs px-2 py-0.5 rounded ${BADGE(p.active)}`}>{p.active ? 'Active' : 'Inactive'}</span></td>
                <td className="py-2 flex gap-2 flex-wrap">
                  {p.cal_booking_url && <a href={p.cal_booking_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">📅 Book</a>}
                  <button onClick={() => { setForm({ ...p }); setIsNew(false) }} className="text-xs text-emerald-400 hover:underline">Edit</button>
                  <button onClick={() => toggleActive(p.id, !p.active)} className="text-xs text-gray-400 hover:underline">{p.active ? 'Deactivate' : 'Activate'}</button>
                  {p.invited_at ? (
                    <span className="text-xs text-gray-500">Invited ✓ {new Date(p.invited_at).toLocaleDateString()}</span>
                  ) : (
                    <button onClick={() => sendInvite(p)} disabled={inviting === p.id} className="text-xs text-amber-400 hover:underline disabled:opacity-50">
                      {inviting === p.id ? 'Inviting…' : 'Invite'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {people.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-600">No reps yet. Add one to get started.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
