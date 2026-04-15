interface Props {
  businessName: string
  tagline: string
  phone: string
  primaryColor: string
  accentColor: string
}

const SERVICES = ['Ant & Roach Control', 'Mosquito Treatment', 'Bed Bug Removal']

export default function CleanFriendlyPreview({ businessName, tagline, phone }: Props) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#f0fdf4', minHeight: '100vh' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 h-16 bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'var(--color-primary)' }}>
            🐛
          </span>
          <span className="font-bold text-gray-800">{businessName}</span>
        </div>
        <span className="text-xs font-semibold px-4 py-2 rounded-full text-white" style={{ background: 'var(--color-primary)' }}>
          📞 {phone}
        </span>
      </nav>

      {/* Hero */}
      <section className="py-20 text-center px-4">
        <div className="inline-block bg-white rounded-full px-4 py-1 text-xs font-semibold mb-4 shadow-sm" style={{ color: 'var(--color-primary)' }}>
          ✨ Family-Safe Treatments
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight" style={{ color: 'var(--color-primary)' }}>
          {tagline || 'A Happier, Pest-Free Home'}
        </h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Friendly service, effective results, and zero hassle.
        </p>
        <div className="flex justify-center gap-3">
          <button className="font-semibold px-8 py-3 rounded-full text-white shadow" style={{ background: 'var(--color-primary)' }}>
            Book Now
          </button>
          <button className="font-semibold px-8 py-3 rounded-full border-2 bg-white" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
            Learn More
          </button>
        </div>
      </section>

      {/* Service cards */}
      <section className="py-12 px-4 bg-white">
        <h2 className="text-center text-2xl font-bold mb-8" style={{ color: 'var(--color-primary)' }}>What We Treat</h2>
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-5">
          {SERVICES.map((s) => (
            <div key={s} className="rounded-2xl border-2 p-5 text-center" style={{ borderColor: 'var(--color-accent)', background: '#fafffe' }}>
              <div className="w-12 h-12 rounded-full mx-auto mb-3 animate-pulse" style={{ background: 'var(--color-accent)', opacity: 0.3 }} />
              <div className="font-semibold text-sm text-gray-700 mb-2">{s}</div>
              <div className="h-2 rounded-full animate-pulse bg-gray-100 mb-1" />
              <div className="h-2 rounded-full animate-pulse bg-gray-100 w-2/3 mx-auto" />
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-5 text-center text-white text-sm rounded-t-3xl mt-4" style={{ background: 'var(--color-primary)' }}>
        {businessName} — Making Homes Pest-Free 🌿
      </footer>
    </div>
  )
}
