import { useState, useEffect, useRef } from 'react'
import { CheckCircle, Loader2, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'

type Status = 'waiting' | 'checking' | 'ready' | 'slow'

function getEmail(): string {
  try { return new URLSearchParams(window.location.search).get('email') || '' }
  catch { return '' }
}

function getSlug(): string {
  const parts = window.location.hostname.split('.')
  if (parts.length >= 3) return parts[0]
  return ''
}

export default function PaymentSuccess() {
  const [elapsed, setElapsed] = useState(0)
  const [status, setStatus] = useState<Status>('waiting')
  const slug = useRef(getSlug())
  const [email] = useState(getEmail)

  async function poll(isCancelled: () => boolean) {
    setStatus('checking')
    const s = slug.current
    if (!s) { setStatus('ready'); return }

    for (let i = 0; i < 4; i++) {
      if (isCancelled()) return
      try {
        const { data } = await supabase.from('tenants').select('id').eq('slug', s).maybeSingle()
        if (data) { setStatus('ready'); return }
      } catch { /* retry */ }
      await new Promise(r => setTimeout(r, 5000))
    }
    setStatus('slow')
  }

  useEffect(() => {
    let cancelled = false

    const tick = setInterval(() => {
      setElapsed(e => {
        const next = e + 1
        if (next >= 30 && !cancelled) {
          clearInterval(tick)
          setStatus(s => s === 'checking' ? 'slow' : s)
        }
        return next
      })
    }, 1000)

    const kickoff = setTimeout(() => {
      if (!cancelled) poll(() => cancelled)
    }, 10000)

    return () => { cancelled = true; clearInterval(tick); clearTimeout(kickoff) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <span className="text-2xl font-bold text-emerald-700 tracking-tight">
            Pest<span className="text-gray-900">Flow</span> Pro
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-8 mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment confirmed — you're all set! ✅</h1>
          <p className="text-gray-500 text-sm mb-2">
            Our team is setting up your site. This typically takes 1–2 business days.
          </p>
          {email && (
            <p className="text-gray-400 text-xs mb-6">
              We'll send your login details to <strong className="text-gray-600">{email}</strong> once setup is complete.
            </p>
          )}

          {(status === 'waiting' || status === 'checking') && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
              <p className="text-sm text-gray-400">
                {status === 'waiting'
                  ? `Confirming your order… (${Math.max(0, 10 - elapsed)}s)`
                  : 'Verifying payment…'}
              </p>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, (elapsed / 30) * 100)}%` }} />
              </div>
            </div>
          )}

          {(status === 'ready' || status === 'slow') && (
            <a
              href="https://pestflowpro.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 w-full justify-center py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition text-sm"
            >
              <ExternalLink size={16} /> Explore PestFlow Pro while you wait →
            </a>
          )}
        </div>

        <p className="text-xs text-gray-400">
          Powered by <span className="font-semibold text-emerald-600">PestFlow Pro</span>
        </p>
      </div>
    </div>
  )
}
