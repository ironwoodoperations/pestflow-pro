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

function getCanceled(): boolean {
  try { return new URLSearchParams(window.location.search).get('canceled') === '1' }
  catch { return false }
}

// ── American Cockroach SVG ──────────────────────────────────────────────────
function CockroachSvg({ angle }: { angle: number }) {
  return (
    <svg
      width="44" height="20" viewBox="0 0 44 20"
      style={{ transform: `rotate(${angle}deg)`, transformOrigin: '22px 10px', display: 'block' }}
      aria-hidden="true"
    >
      {/* Antennae */}
      <line x1="38" y1="7"  x2="44" y2="1"  stroke="#5C2A0A" strokeWidth="0.8" />
      <line x1="38" y1="9"  x2="44" y2="6"  stroke="#5C2A0A" strokeWidth="0.8" />
      {/* Body */}
      <ellipse cx="22" cy="10" rx="20" ry="8" fill="#8B3A0F" />
      {/* Wing lines */}
      <line x1="8" y1="10" x2="36" y2="10" stroke="#6B2D0A" strokeWidth="0.9" />
      <line x1="10" y1="7"  x2="34" y2="7"  stroke="#6B2D0A" strokeWidth="0.7" opacity="0.6" />
      {/* Pronotum */}
      <ellipse cx="35" cy="10" rx="8" ry="6" fill="#A0522D" />
      {/* Pronotum shield mark */}
      <ellipse cx="35" cy="10" rx="4" ry="3" fill="#D4A017" opacity="0.7" />
      {/* Head */}
      <ellipse cx="41" cy="10" rx="3" ry="2.5" fill="#7A3010" />
      {/* Legs — 3 per side */}
      <line x1="16" y1="9"  x2="10" y2="4"  stroke="#5C2A0A" strokeWidth="0.9" />
      <line x1="22" y1="9"  x2="16" y2="3"  stroke="#5C2A0A" strokeWidth="0.9" />
      <line x1="28" y1="9"  x2="24" y2="3"  stroke="#5C2A0A" strokeWidth="0.9" />
      <line x1="16" y1="11" x2="10" y2="16" stroke="#5C2A0A" strokeWidth="0.9" />
      <line x1="22" y1="11" x2="16" y2="17" stroke="#5C2A0A" strokeWidth="0.9" />
      <line x1="28" y1="11" x2="24" y2="17" stroke="#5C2A0A" strokeWidth="0.9" />
    </svg>
  )
}

// ── Roach canvas animation ──────────────────────────────────────────────────
interface Roach {
  x: number; y: number; vx: number; vy: number; angle: number; opacity: number
}

function useRoaches(count: number, confirmed: boolean) {
  const [roaches, setRoaches] = useState<Roach[]>([])
  const animRef = useRef<number | null>(null)
  const confirmedRef = useRef(false)
  const scatterStartRef = useRef<number | null>(null)

  useEffect(() => {
    const W = window.innerWidth
    const H = window.innerHeight
    const initial: Roach[] = Array.from({ length: count }, () => {
      // Spawn on the edges, outside the center card zone
      const side = Math.floor(Math.random() * 4)
      let x: number, y: number
      if (side === 0) { x = Math.random() * W;      y = Math.random() * 80 }
      else if (side === 1) { x = W - 60;            y = Math.random() * H }
      else if (side === 2) { x = Math.random() * W; y = H - 40 }
      else                 { x = 0;                 y = Math.random() * H }
      const speed = 0.4 + Math.random() * 0.4
      const dir = Math.random() * Math.PI * 2
      return { x, y, vx: Math.cos(dir) * speed, vy: Math.sin(dir) * speed, angle: 0, opacity: 1 }
    })
    setRoaches(initial)

    function tick() {
      setRoaches(prev => prev.map(r => {
        const W = window.innerWidth
        const H = window.innerHeight
        // Safe zone around center card: 350×280
        const cx = W / 2, cy = H / 2
        const safeW = 175, safeH = 140

        if (confirmedRef.current) {
          // Scatter toward nearest edge
          if (scatterStartRef.current === null) scatterStartRef.current = performance.now()
          const elapsed = performance.now() - (scatterStartRef.current || 0)
          const speed = 3 + (elapsed / 200)
          const angle = Math.atan2(r.vy, r.vx)
          const nx = r.x + Math.cos(angle) * speed
          const ny = r.y + Math.sin(angle) * speed
          const fadeOpacity = Math.max(0, r.opacity - 0.012)
          return { ...r, x: nx, y: ny, opacity: fadeOpacity }
        }

        // Random walk with slight wobble
        const wobble = (Math.random() - 0.5) * 0.15
        let vx = r.vx + wobble
        let vy = r.vy + wobble
        const speed = Math.sqrt(vx * vx + vy * vy)
        if (speed > 0.8) { vx = (vx / speed) * 0.8; vy = (vy / speed) * 0.8 }
        if (speed < 0.3) { vx *= 1.1; vy *= 1.1 }

        let nx = r.x + vx
        let ny = r.y + vy

        // Bounce off walls
        if (nx < 0 || nx > W - 44) vx = -vx
        if (ny < 0 || ny > H - 20) vy = -vy

        // Steer away from center safe zone
        if (nx > cx - safeW && nx < cx + safeW && ny > cy - safeH && ny < cy + safeH) {
          vx = nx < cx ? -0.8 : 0.8
          vy = ny < cy ? -0.8 : 0.8
        }

        nx = Math.max(0, Math.min(W - 44, r.x + vx))
        ny = Math.max(0, Math.min(H - 20, r.y + vy))

        const angle = Math.atan2(vy, vx) * (180 / Math.PI)
        return { ...r, x: nx, y: ny, vx, vy, angle, opacity: r.opacity }
      }))
      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [count])

  useEffect(() => {
    confirmedRef.current = confirmed
  }, [confirmed])

  return roaches
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function PaymentSuccess() {
  const [elapsed, setElapsed] = useState(0)
  const [status, setStatus] = useState<Status>('waiting')
  const slug = useRef(getSlug())
  const [email] = useState(getEmail)
  const [canceled] = useState(getCanceled)

  const confirmed = status === 'ready' || status === 'slow'
  const roaches = useRoaches(5, confirmed)

  if (canceled) {
    // Stripe cancel_url lands here with ?canceled=1 (replaces the dead
    // /payment-cancel apex path which 404s post-PR-40 lockdown).
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <span className="text-2xl font-bold text-emerald-700 tracking-tight">
              Pest<span className="text-gray-900">Flow</span> Pro
            </span>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment canceled</h1>
            <p className="text-gray-500 text-sm mb-6">
              No charge was made. Try again or contact us if you need help.
            </p>
            <a
              href="mailto:admin@pestflowpro.com"
              className="inline-block py-3 px-6 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition text-sm"
            >
              Contact us
            </a>
          </div>
          <p className="text-xs text-gray-400">
            Powered by <span className="font-semibold text-emerald-600">PestFlow Pro</span>
          </p>
        </div>
      </div>
    )
  }

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
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex flex-col items-center justify-center px-4 overflow-hidden relative">

      {/* Cockroaches */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        {roaches.map((r, i) => (
          <div
            key={i}
            style={{ position: 'absolute', left: r.x, top: r.y, opacity: r.opacity, transition: 'opacity 0.1s' }}
          >
            <CockroachSvg angle={r.angle} />
          </div>
        ))}
      </div>

      <div className="w-full max-w-md text-center relative" style={{ zIndex: 1 }}>
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
