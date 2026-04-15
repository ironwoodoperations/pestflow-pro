interface Props {
  businessName: string
  tagline: string
  phone: string
  primaryColor: string
  accentColor: string
}

const SERVICES = ['Outdoor Pest Control', 'Termite Inspection', 'Wildlife Exclusion']

export default function RusticRuggedPreview({ businessName, tagline, phone }: Props) {
  return (
    <div style={{ fontFamily: '"Georgia", serif', background: '#faf7f2', minHeight: '100vh' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 h-16" style={{ background: '#3b2a1a' }}>
        <div>
          <span className="text-amber-100 font-bold text-lg tracking-wide">{businessName}</span>
          <span className="ml-3 text-amber-600/70 text-xs uppercase tracking-widest">Est. Since Day One</span>
        </div>
        <span className="text-xs font-bold px-4 py-2 rounded" style={{ background: 'var(--color-accent)', color: '#3b2a1a' }}>
          📞 {phone}
        </span>
      </nav>

      {/* Hero */}
      <section className="py-24 text-center px-4 relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #3b2a1a 0%, #5c3d1e 60%, #7a5230 100%)' }}>
        {/* Wood-grain texture lines */}
        <div className="absolute inset-0 opacity-10" style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.3) 40px, rgba(255,255,255,0.3) 41px)' }} />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-accent)' }}>
            🌿 Serving Your Community
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-amber-50 mb-5 leading-tight">
            {tagline || 'Tough on Pests. Gentle on Your Home.'}
          </h1>
          <p className="text-amber-200/60 mb-8 max-w-md mx-auto text-lg">
            Honest work from people who know the land.
          </p>
          <button className="font-bold px-10 py-3 rounded text-white" style={{ background: 'var(--color-primary)' }}>
            Schedule a Visit
          </button>
        </div>
      </section>

      {/* Service cards */}
      <section className="py-14 px-4" style={{ background: '#f5f0e8' }}>
        <h2 className="text-center text-2xl font-bold text-amber-900 mb-8">Our Specialties</h2>
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6">
          {SERVICES.map((s) => (
            <div key={s} className="rounded-lg p-5 border" style={{ background: '#fff', borderColor: '#d4b896' }}>
              <div className="h-20 rounded mb-4 animate-pulse" style={{ background: '#d4b896', opacity: 0.4 }} />
              <div className="font-bold text-sm text-amber-900 mb-2">{s}</div>
              <div className="h-2 rounded animate-pulse mb-1" style={{ background: '#e8d9c4' }} />
              <div className="h-2 rounded animate-pulse w-3/4" style={{ background: '#e8d9c4' }} />
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-5 text-center text-amber-100 text-sm" style={{ background: '#3b2a1a' }}>
        {businessName} — Rooted in Your Community
      </footer>
    </div>
  )
}
