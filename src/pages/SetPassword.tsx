import { useEffect, useRef, useState } from 'react'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { useTenant } from '../context/TenantBootProvider'

// S273 PR #2b — shared set-password page for BOTH invite (type=invite) and recovery
// (type=recovery). One route, declared before the `*` catch-all in App.tsx.
//
// Token handling (validator-locked):
//   - Reads token_hash + type from the URL, then history.replaceState IMMEDIATELY (before any
//     await) so the bearer token never lingers in history/referrer — even if verify then fails.
//   - Uses its OWN Supabase client with detectSessionInUrl:false AND persistSession:false, created
//     INSIDE the component (never the shared singleton, never module-level/exported). verifyOtp
//     would otherwise persist a session to localStorage, leaving the user silently authenticated.
//   - verifyOtp({token_hash,type}) → updateUser({password}) → signOut → send to /admin/login.
//     No auto-session: both flows require a fresh login with the new password.

type Phase = 'verifying' | 'ready' | 'submitting' | 'done' | 'error'

export default function SetPassword() {
  const tenant = useTenant()
  const clientRef = useRef<SupabaseClient | null>(null)
  const [phase, setPhase] = useState<Phase>('verifying')
  const [linkType, setLinkType] = useState<'invite' | 'recovery'>('recovery')
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    // Capture token + type, then strip from the URL before doing anything async.
    const params = new URLSearchParams(window.location.search)
    const tokenHash = params.get('token_hash') || ''
    const t: 'invite' | 'recovery' = params.get('type') === 'invite' ? 'invite' : 'recovery'
    setLinkType(t)
    window.history.replaceState({}, '', '/set-password')

    if (!tokenHash) {
      setPhase('error')
      setError('This link is missing its security token. Please request a new one.')
      return
    }

    const sb = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      { auth: { detectSessionInUrl: false, persistSession: false, autoRefreshToken: false } },
    )
    clientRef.current = sb

    sb.auth.verifyOtp({ token_hash: tokenHash, type: t }).then(({ error: verifyErr }) => {
      if (verifyErr) {
        setPhase('error')
        setError('This link has expired or was replaced by a newer one. Request a fresh link to continue.')
      } else {
        setPhase('ready')
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    setError('')
    setPhase('submitting')
    const sb = clientRef.current
    if (!sb) { setPhase('error'); setError('Something went wrong. Please request a new link.'); return }
    const { error: updateErr } = await sb.auth.updateUser({ password: form.password })
    if (updateErr) { setPhase('ready'); setError(updateErr.message); return }
    // No auto-session — clear the transient session and require a fresh login.
    await sb.auth.signOut()
    setPhase('done')
    setTimeout(() => { window.location.assign('/admin/login') }, 1800)
  }

  const primary = tenant.primaryColor || '#10b981'
  const businessName = tenant.name || 'PestFlow Pro'
  const heading = linkType === 'invite' ? 'Set your password' : 'Reset your password'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a1f2e 100%)' }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        {tenant.logoUrl ? (
          <div className="flex justify-center mb-4">
            <img src={tenant.logoUrl} alt={businessName} style={{ maxHeight: '80px', maxWidth: '200px', objectFit: 'contain' }} />
          </div>
        ) : (
          <h1 className="font-oswald text-3xl text-center mb-1 tracking-wide" style={{ color: primary }}>{businessName}</h1>
        )}
        <p className="text-gray-500 text-sm text-center mb-8">{heading}</p>

        {phase === 'verifying' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: primary, borderTopColor: 'transparent' }} />
            <p className="text-gray-500 text-sm">Verifying your link…</p>
          </div>
        )}

        {phase === 'error' && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
            <a href="/admin/login" className="block text-center w-full text-white font-medium py-2.5 rounded-lg transition hover:opacity-90" style={{ backgroundColor: primary }}>
              Back to Login
            </a>
          </div>
        )}

        {phase === 'done' && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-3 text-sm">
              Password set. Redirecting you to sign in…
            </div>
            <a href="/admin/login" className="block text-center w-full text-white font-medium py-2.5 rounded-lg transition hover:opacity-90" style={{ backgroundColor: primary }}>
              Go to Login
            </a>
          </div>
        )}

        {(phase === 'ready' || phase === 'submitting') && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
              <input
                type="password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent placeholder-gray-400"
                style={{ '--tw-ring-color': primary } as React.CSSProperties}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <input
                type="password"
                placeholder="Re-enter your password"
                value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent placeholder-gray-400"
                style={{ '--tw-ring-color': primary } as React.CSSProperties}
                required
              />
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}
            <button
              type="submit"
              disabled={phase === 'submitting'}
              className="w-full text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: primary }}
            >
              {phase === 'submitting' ? 'Saving…' : 'Save Password'}
            </button>
          </form>
        )}
      </div>
      <p className="mt-6 text-xs text-gray-500">
        Powered by{' '}
        <a href="https://pestflowpro.ai" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300">
          PestFlow Pro
        </a>
      </p>
    </div>
  )
}
