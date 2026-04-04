import { useState, useEffect } from 'react'
import { CheckCircle, Loader2, ExternalLink, Clock } from 'lucide-react'

type Status = 'waiting' | 'checking' | 'ready' | 'slow'

export default function PaymentSuccess() {
  const [elapsed, setElapsed] = useState(0)
  const [status, setStatus] = useState<Status>('waiting')

  // Derive the login URL from current hostname
  const loginUrl = '/admin/login'

  // After 10 seconds, check if admin login responds; fail-safe at 30s
  useEffect(() => {
    const tick = setInterval(() => {
      setElapsed(e => {
        const next = e + 1
        if (next === 10 && status === 'waiting') {
          clearInterval(tick)
          checkReady()
        }
        if (next >= 30 && status === 'checking') {
          setStatus('slow')
        }
        return next
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  async function checkReady() {
    setStatus('checking')
    // Poll up to 20 seconds for the admin login to become available
    for (let i = 0; i < 4; i++) {
      try {
        const res = await fetch(loginUrl, { method: 'HEAD', cache: 'no-store' })
        if (res.ok) { setStatus('ready'); return }
      } catch { /* not ready yet */ }
      await new Promise(r => setTimeout(r, 5000))
    }
    setStatus('slow')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-8">
          <span className="text-2xl font-bold text-emerald-700 tracking-tight">
            Pest<span className="text-gray-900">Flow</span> Pro
          </span>
        </div>

        {/* Payment confirmed badge */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-8 mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-emerald-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Received!</h1>
          <p className="text-gray-500 text-sm mb-6">
            Your site is being set up — this takes about 60 seconds.
          </p>

          {/* Status indicator */}
          {(status === 'waiting' || status === 'checking') && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
              <p className="text-sm text-gray-400">
                {status === 'waiting'
                  ? `Setting up your site… (${Math.max(0, 10 - elapsed)}s)`
                  : 'Almost ready — checking your site…'}
              </p>
              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, (elapsed / 30) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {status === 'ready' && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                <CheckCircle size={16} /> Your site is ready!
              </div>
              <a
                href={loginUrl}
                className="flex items-center gap-2 w-full justify-center py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition text-sm"
              >
                <ExternalLink size={16} />
                Go to Admin Login
              </a>
            </div>
          )}

          {status === 'slow' && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <Clock size={16} />
                Setup is taking a moment — try your login link in a minute.
              </div>
              <a
                href={loginUrl}
                className="flex items-center gap-2 w-full justify-center py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition text-sm"
              >
                <ExternalLink size={16} />
                Go to Admin Login
              </a>
              <p className="text-xs text-gray-400 break-all">{window.location.origin + loginUrl}</p>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400">
          Powered by <span className="font-semibold text-emerald-600">PestFlow Pro</span>
        </p>
      </div>
    </div>
  )
}
