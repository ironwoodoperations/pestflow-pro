interface Props {
  businessName: string
  tagline: string
  phone: string
  primaryColor: string
  accentColor: string
}

const SERVICES = ['General Pest Control', 'Termite Control', 'Rodent Control']

export default function MetroProPreview({ businessName, tagline, phone }: Props) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#0a0f1e', minHeight: '100vh' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 h-16 border-b border-white/10" style={{ background: '#0d1526' }}>
        <span className="text-white font-bold text-lg tracking-tight">{businessName}</span>
        <div className="flex items-center gap-6">
          <span className="text-white/50 text-xs hidden md:block">Services</span>
          <span className="text-white/50 text-xs hidden md:block">About</span>
          <span className="text-xs font-semibold px-4 py-2 rounded text-white" style={{ background: 'var(--color-primary)' }}>
            {phone}
          </span>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-28 text-center px-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d1526 0%, var(--color-primary) 100%)' }}>
        <div className="absolute inset-0 opacity-5" style={{ background: 'radial-gradient(circle at 70% 50%, white 0%, transparent 60%)' }} />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-accent)' }}>
            Urban Pest Control Specialists
          </p>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-5 leading-tight">
            {tagline || 'Precision Pest Control for the Modern City'}
          </h1>
          <p className="text-white/50 mb-10 max-w-lg mx-auto text-lg">
            Fast response. Guaranteed results. Zero disruption.
          </p>
          <div className="flex justify-center gap-4">
            <button className="font-semibold px-10 py-3 rounded text-white" style={{ background: 'var(--color-accent)' }}>
              Get Free Quote
            </button>
            <button className="font-semibold px-10 py-3 rounded border border-white/30 text-white hover:bg-white/10 transition">
              Our Services
            </button>
          </div>
        </div>
      </section>

      {/* Service cards */}
      <section className="py-14 px-4" style={{ background: '#0f1b30' }}>
        <h2 className="text-center text-xl font-bold text-white mb-8 uppercase tracking-widest">
          Services
        </h2>
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-5">
          {SERVICES.map((s) => (
            <div key={s} className="rounded-xl p-5 border border-white/10" style={{ background: '#152035' }}>
              <div className="h-20 rounded-lg mb-4 animate-pulse" style={{ background: 'var(--color-primary)', opacity: 0.25 }} />
              <div className="font-bold text-sm text-white mb-2">{s}</div>
              <div className="h-2 rounded animate-pulse mb-1.5" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <div className="h-2 rounded animate-pulse w-2/3" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-5 text-center text-white/40 text-xs border-t border-white/10">
        {businessName} · Professional Pest Management
      </footer>
    </div>
  )
}
