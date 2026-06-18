'use client'

// S273 PR #2c — set-password page in the Next.js public-site app, so it resolves on the
// tenant subdomain the invite/reset link targets (https://<slug>.pestflowpro.ai/set-password).
// Handles BOTH invite (type=invite) and recovery (type=recovery) on one route.
//
// Security model (validator-locked):
//  - Own Supabase client, constructed INSIDE the component (never the shared
//    createBrowserSupabase factory, never module-global), with detectSessionInUrl:false AND
//    persistSession:false — otherwise verifyOtp would persist a session and silently log the
//    user in off the recovery/invite token (H2/H4 of #2b carried forward).
//  - N2: token_hash + type are read ONLY client-side from window.location.search inside
//    useEffect — never via the Next server searchParams prop (would leak the token into server
//    request logs). The token is stripped from the URL (replaceState) BEFORE await verifyOtp.
//  - H1: fail closed unless both token_hash and a valid type ∈ {invite,recovery} are present.
//  - N1: the post-success redirect host is NOT trusted from the URL slug. We validate the
//    current subdomain's tenant (get_tenant_boot) against the token-bound user's membership;
//    only a validated match redirects (relative /admin/login), else fall back to apex. The raw
//    slug is never interpolated into a redirect URL.
//  - The page NEVER calls notFound() — it resolves for every slug, incl. standalone tenants.
//  - Referrer-Policy/X-Frame-Options/CSP for this route are set in middleware.ts.

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type Phase = 'verifying' | 'ready' | 'submitting' | 'done' | 'error'

const APEX_LOGIN = 'https://pestflowpro.ai/admin/login'

export default function SetPasswordPage() {
  const params = useParams<{ slug: string }>()
  const urlSlug = typeof params?.slug === 'string'
    ? params.slug
    : Array.isArray(params?.slug) ? params.slug[0] : ''

  const clientRef = useRef<SupabaseClient | null>(null)
  const [phase, setPhase] = useState<Phase>('verifying')
  const [linkType, setLinkType] = useState<'invite' | 'recovery'>('recovery')
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    // N2 — read the token client-side only.
    const qs = new URLSearchParams(window.location.search)
    const tokenHash = qs.get('token_hash') || ''
    const rawType = qs.get('type') || ''
    // replaceState BEFORE any await — strip the bearer token from the URL immediately.
    window.history.replaceState({}, '', '/set-password')

    // H1 — fail closed on missing/invalid params (no verifyOtp call).
    if (!tokenHash || (rawType !== 'invite' && rawType !== 'recovery')) {
      setPhase('error')
      setError('This link is invalid or incomplete. Please request a new one.')
      return
    }
    const t = rawType as 'invite' | 'recovery'
    setLinkType(t)

    // Own client — detectSessionInUrl:false + persistSession:false, component-scoped.
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { detectSessionInUrl: false, persistSession: false, autoRefreshToken: false } },
    )
    clientRef.current = sb

    sb.auth.verifyOtp({ token_hash: tokenHash, type: t }).then(({ error: verifyErr }) => {
      if (verifyErr) {
        // Fail-gracefully — token already stripped, no reload retry.
        setPhase('error')
        setError('This link has expired or was replaced by a newer one. Request a fresh link to continue.')
      } else {
        setPhase('ready')
      }
    })
  }, [])

  // N1 — validate the current subdomain against the token-bound user's membership.
  async function resolveRedirect(sb: SupabaseClient): Promise<string> {
    try {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return APEX_LOGIN
      const [{ data: boot }, { data: memberships }] = await Promise.all([
        sb.rpc('get_tenant_boot', { slug_param: urlSlug }),
        sb.from('tenant_users').select('tenant_id').eq('user_id', user.id),
      ])
      const currentTenantId = (boot as { id?: string } | null)?.id
      const myTenantIds = (memberships ?? []).map((m: { tenant_id: string }) => m.tenant_id)
      if (currentTenantId && myTenantIds.includes(currentTenantId)) {
        return '/admin/login' // validated host → relative, never interpolate the raw slug
      }
      return APEX_LOGIN
    } catch {
      return APEX_LOGIN
    }
  }

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
    const dest = await resolveRedirect(sb)
    await sb.auth.signOut() // no auto-session — require a fresh login
    setPhase('done')
    setTimeout(() => { window.location.assign(dest) }, 1500)
  }

  const heading = linkType === 'invite' ? 'Set your password' : 'Reset your password'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'linear-gradient(135deg, #0a0f1e 0%, #1a1f2e 100%)' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 16, boxShadow: '0 20px 50px rgba(0,0,0,0.3)', padding: 32 }}>
        <h1 style={{ fontFamily: 'Oswald, system-ui, sans-serif', fontSize: 28, textAlign: 'center', margin: '0 0 4px', color: '#10b981', letterSpacing: '0.02em' }}>PestFlow Pro</h1>
        <p style={{ color: '#6b7280', fontSize: 14, textAlign: 'center', margin: '0 0 28px' }}>{heading}</p>

        {phase === 'verifying' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0' }}>
            <div style={{ width: 32, height: 32, border: '2px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Verifying your link…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {phase === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: 12, fontSize: 14 }}>{error}</div>
            <a href="/admin/login" style={{ display: 'block', textAlign: 'center', width: '100%', background: '#10b981', color: '#fff', fontWeight: 600, padding: '10px 0', borderRadius: 8, textDecoration: 'none' }}>Back to Login</a>
          </div>
        )}

        {phase === 'done' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', borderRadius: 8, padding: 12, fontSize: 14 }}>Password set. Redirecting you to sign in…</div>
          </div>
        )}

        {(phase === 'ready' || phase === 'submitting') && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 }}>New Password</label>
              <input type="password" placeholder="At least 8 characters" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Confirm Password</label>
              <input type="password" placeholder="Re-enter your password" value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} required />
            </div>
            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: 12, fontSize: 14 }}>{error}</div>}
            <button type="submit" disabled={phase === 'submitting'}
              style={{ width: '100%', background: '#10b981', color: '#fff', fontWeight: 600, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', opacity: phase === 'submitting' ? 0.5 : 1 }}>
              {phase === 'submitting' ? 'Saving…' : 'Save Password'}
            </button>
          </form>
        )}
      </div>
      <p style={{ marginTop: 24, fontSize: 12, color: '#6b7280' }}>
        Powered by <a href="https://pestflowpro.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#fb923c', textDecoration: 'none' }}>PestFlow Pro</a>
      </p>
    </div>
  )
}
