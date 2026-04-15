interface Props {
  businessName: string
  tagline: string
  phone: string
  primaryColor: string
  accentColor: string
}

const SERVICES = ['Pest Control', 'Termite Defense', 'Rodent Removal']

export default function BoldLocalPreview({ businessName, tagline, phone }: Props) {
  return (
    <div style={{ fontFamily: '"Impact", "Arial Black", sans-serif', background: '#111', minHeight: '100vh' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 h-16 border-b border-white/10">
        <span className="text-white font-extrabold text-xl uppercase tracking-widest">{businessName}</span>
        <span className="text-xs font-bold px-5 py-2 uppercase tracking-wider" style={{ background: 'var(--color-accent)', color: '#111' }}>
          {phone}
        </span>
      </nav>

      {/* Hero */}
      <section className="py-24 px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ background: 'repeating-linear-gradient(45deg, white, white 1px, transparent 1px, transparent 12px)' }} />
        <div className="relative max-w-3xl">
          <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-accent)' }}>
            ★ Locally Owned &amp; Operated
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase leading-none mb-6">
            {tagline || 'WE KILL PESTS. PERIOD.'}
          </h1>
          <p className="text-white/50 text-lg mb-10 font-normal" style={{ fontFamily: 'Arial, sans-serif' }}>
            No contracts. No surprises. Just results.
          </p>
          <div className="flex gap-4">
            <button className="font-black text-sm uppercase tracking-widest px-8 py-4" style={{ background: 'var(--color-accent)', color: '#111' }}>
              Call Now
            </button>
            <button className="font-black text-sm uppercase tracking-widest px-8 py-4 border-2 text-white" style={{ borderColor: 'var(--color-accent)' }}>
              Free Inspection
            </button>
          </div>
        </div>
      </section>

      {/* Service cards */}
      <section className="py-12 px-8" style={{ background: '#1a1a1a' }}>
        <h2 className="text-xl font-black text-white uppercase tracking-widest mb-8">What We Do</h2>
        <div className="grid grid-cols-3 gap-4 max-w-4xl">
          {SERVICES.map((s) => (
            <div key={s} className="border border-white/10 p-6" style={{ background: '#222' }}>
              <div className="h-1 w-10 mb-4" style={{ background: 'var(--color-accent)' }} />
              <div className="text-white font-black text-sm uppercase tracking-wide mb-3">{s}</div>
              <div className="h-2 rounded animate-pulse bg-white/10 mb-2" />
              <div className="h-2 rounded animate-pulse bg-white/10 w-2/3" />
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-5 px-8 border-t border-white/10">
        <span className="text-white/50 text-xs uppercase tracking-widest font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>
          {businessName} — {phone}
        </span>
      </footer>
    </div>
  )
}
