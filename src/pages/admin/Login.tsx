import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../context/TenantBootProvider'

interface Branding {
  logo_url?: string
  primary_color?: string
}

export default function Login() {
  const { id: tenantId } = useTenant()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [businessName, setBusinessName] = useState('PestFlow Pro')
  const [branding, setBranding] = useState<Branding>({})
  const [resetMode, setResetMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    ;(async () => {
      const [bizRes, brandRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
      ])
      if (bizRes.data?.value?.name) setBusinessName(bizRes.data.value.name)
      if (brandRes.data?.value) setBranding(brandRes.data.value as Branding)
    })()
  }, [tenantId])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword(form)
    if (authError) { setError(authError.message); setLoading(false); return }

    const { data: membership } = await supabase
      .from('tenant_users')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (!membership) {
      await supabase.auth.signOut()
      setError("You don't have access to this account.")
      setLoading(false)
      return
    }

    navigate('/admin')
  }

  // Password reset request. Response is intentionally generic — never reveal whether the
  // email exists (the edge fn always returns the same shape; we always show the same notice).
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetting(true)
    await supabase.functions.invoke('password-reset-request', { body: { email: resetEmail.trim().toLowerCase() } })
    setResetting(false)
    setResetSent(true)
  }

  const primary = branding.primary_color || '#10b981'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a1f2e 100%)' }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        {branding.logo_url ? (
          <div className="flex justify-center mb-4">
            <img src={branding.logo_url} alt={businessName} style={{ maxHeight: '80px', maxWidth: '200px', objectFit: 'contain' }} />
          </div>
        ) : (
          <h1 className="font-oswald text-3xl text-center mb-1 tracking-wide" style={{ color: primary }}>{businessName}</h1>
        )}
        {branding.logo_url && (
          <h2 className="text-center text-lg font-semibold text-gray-700 mb-1">{businessName}</h2>
        )}
        <p className="text-gray-500 text-sm text-center mb-8">Admin Portal</p>
        {resetMode ? (
          resetSent ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-3 text-sm">
                If an account exists for that email, a password reset link is on its way.
              </div>
              <button onClick={() => { setResetMode(false); setResetSent(false); setResetEmail('') }}
                className="w-full text-white font-medium py-2.5 rounded-lg transition hover:opacity-90" style={{ backgroundColor: primary }}>
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-sm text-gray-600">Enter your email and we'll send you a link to reset your password.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input type="email" placeholder="admin@yourcompany.com" value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent placeholder-gray-400"
                  style={{ '--tw-ring-color': primary } as React.CSSProperties} required />
              </div>
              <button type="submit" disabled={resetting}
                className="w-full text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 hover:opacity-90" style={{ backgroundColor: primary }}>
                {resetting ? 'Sending…' : 'Send Reset Link'}
              </button>
              <button type="button" onClick={() => setResetMode(false)} className="w-full text-sm text-gray-500 hover:text-gray-700">
                Back to Sign In
              </button>
            </form>
          )
        ) : (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              placeholder="admin@yourcompany.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent placeholder-gray-400"
              style={{ '--tw-ring-color': primary } as React.CSSProperties}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent placeholder-gray-400"
              style={{ '--tw-ring-color': primary } as React.CSSProperties}
              required
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: primary }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <button type="button" onClick={() => setResetMode(true)} className="w-full text-sm text-gray-500 hover:text-gray-700">
            Forgot password?
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
