import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import type { Role } from '../../../lib/permissions'

interface Member { user_id: string; email: string; role: string }

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

const ROLE_LABEL: Record<string, string> = { admin: 'Admin', manager: 'Manager', user: 'User' }
const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  manager: 'bg-blue-50 text-blue-700 border-blue-200',
  user: 'bg-gray-100 text-gray-600 border-gray-200',
}

/** Pull the server's JSON {error} off a FunctionsHttpError, falling back to a generic message. */
async function readFnError(error: unknown, fallback: string): Promise<string> {
  try {
    const ctx = (error as { context?: Response })?.context
    if (ctx && typeof ctx.json === 'function') {
      const body = await ctx.json()
      if (body?.error) return body.error as string
    }
  } catch { /* ignore */ }
  return fallback
}

export default function UsersSection() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<{ email: string; role: Role }>({ email: '', role: 'user' })
  const [inviting, setInviting] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('list_tenant_members')
    if (error) toast.error(`Failed to load team: ${error.message}`)
    else setMembers((data || []) as Member[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    const email = form.email.trim().toLowerCase()
    if (!email) return
    setInviting(true)
    const { data, error } = await supabase.functions.invoke('invite-team-member', {
      body: { email, role: form.role },
    })
    setInviting(false)
    if (error) { toast.error(await readFnError(error, 'Could not send the invitation.')); return }
    toast.success(data?.status === 'added' ? 'Existing user added to your team.' : 'Invitation sent.')
    setForm({ email: '', role: 'user' })
    load()
  }

  async function handleResend(member: Member) {
    const { error } = await supabase.functions.invoke('invite-team-member', {
      body: { email: member.email, role: member.role },
    })
    if (error) toast.error(await readFnError(error, 'Could not resend the invitation.'))
    else toast.success('A fresh invitation link was sent.')
  }

  return (
    <div className="space-y-4">
      <details className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <summary className="text-sm font-semibold text-blue-900 cursor-pointer select-none">👥 Team — How to use this</summary>
        <div className="mt-3 text-sm text-blue-800 space-y-2">
          <p>Invite the people who help run your site and choose what they can do.</p>
          <ul className="list-none space-y-1">
            <li><strong>ADMIN</strong> — Full access, including this Users tab, Settings, and billing.</li>
            <li><strong>MANAGER</strong> — Can edit website content (blog, SEO, social, team), but not Settings or billing.</li>
            <li><strong>USER</strong> — View-only access to the dashboard.</li>
          </ul>
          <p className="text-blue-700 italic">💡 Seats are unlimited — invite as many teammates as you need.</p>
        </div>
      </details>

      {/* Invite */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Invite a teammate</h3>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="teammate@yourbusiness.com" className={inputClass} required />
          </div>
          <div className="sm:w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))} className={inputClass}>
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" disabled={inviting}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap">
            {inviting ? 'Sending…' : 'Send Invite'}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-3">Seats: <span className="font-medium text-gray-700">Unlimited</span></p>
      </div>

      {/* Roster */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Team members</h3>
        {loading ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : members.length === 0 ? (
          <p className="text-gray-400 text-sm">No team members yet. Invite someone above.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {members.map(m => (
              <li key={m.user_id} className="flex items-center justify-between py-3 gap-3">
                <span className="text-sm text-gray-800 truncate">{m.email}</span>
                <span className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${ROLE_BADGE[m.role] || ROLE_BADGE.user}`}>
                    {ROLE_LABEL[m.role] || m.role}
                  </span>
                  <button onClick={() => handleResend(m)} className="text-xs text-gray-500 hover:text-emerald-600 transition-colors">
                    Resend invite
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
