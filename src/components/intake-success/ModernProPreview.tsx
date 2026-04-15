interface Props {
  businessName: string
  tagline: string
  phone: string
  primaryColor: string
  accentColor: string
}

const SERVICES = ['General Pest Control', 'Termite Control', 'Rodent Control']

export default function ModernProPreview({ businessName, tagline, phone }: Props) {
  return (
    <div style={{ fontFamily: 'Georgia, serif', background: '#fff', minHeight: '100vh' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 h-16" style={{ background: 'var(--color-primary)' }}>
        <span className="text-white font-bold text-lg tracking-tight">{businessName}</span>
        <span className="text-xs font-semibold px-4 py-2 rounded bg-white" style={{ color: 'var(--color-primary)' }}>
          📞 {phone}
        </span>
      </nav>

      {/* Hero */}
      <section className="py-24 text-center px-4" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #0f2248 100%)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-accent)' }}>
          Licensed &amp; Insured
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
          {tagline || 'Professional Pest Control You Can Trust'}
        </h1>
        <p className="text-white/60 mb-8 max-w-md mx-auto">
          Protecting homes and businesses with proven treatment programs.
        </p>
        <button
          className="font-semibold px-10 py-3 rounded text-white hover:opacity-90 transition"
          style={{ background: 'var(--color-accent)' }}
        >
          Get Free Quote
        </button>
      </section>

      {/* Service cards */}
      <section className="py-14 px-4" style={{ background: '#f8f9fa' }}>
        <h2 className="text-center text-2xl font-bold text-gray-800 mb-8">Our Services</h2>
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6">
          {SERVICES.map((s) => (
            <div key={s} className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
              <div className="h-20 rounded mb-4 animate-pulse" style={{ background: 'var(--color-primary)', opacity: 0.12 }} />
              <div className="font-bold text-sm text-gray-800 mb-2">{s}</div>
              <div className="h-2 rounded animate-pulse bg-gray-100 mb-1.5" />
              <div className="h-2 rounded animate-pulse bg-gray-100 w-3/4" />
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-5 text-center text-white text-sm" style={{ background: 'var(--color-primary)' }}>
        {businessName} — Professional Pest Control
      </footer>
    </div>
  )
}
