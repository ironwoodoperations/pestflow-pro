const STRIPS = [
  { icon: '🏠', label: 'Residential', href: '/pest-control' },
  { icon: '🏢', label: 'Commercial', href: '/pest-control' },
  { icon: '🏗️', label: 'Facilities', href: '/pest-control' },
]

export default function RusticRuggedServiceStrips() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3">
      {STRIPS.map((s, i) => (
        <div key={i} className="flex items-center gap-4 px-8 py-6 transition hover:brightness-125"
          style={{ backgroundColor: '#1a1a1a', borderLeft: '3px solid var(--color-primary)' }}>
          <span className="text-3xl" aria-hidden="true">{s.icon}</span>
          <div>
            <p className="text-white font-bold text-lg">{s.label}</p>
            <a href={s.href} className="text-sm font-medium transition" style={{ color: 'var(--color-primary)' }}>
              Learn More →
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}
