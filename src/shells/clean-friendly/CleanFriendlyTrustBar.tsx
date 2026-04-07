const SIGNALS = [
  {
    label: 'Pet & Family Safe',
    desc: 'Treatments that protect your family and pets',
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    label: 'Eco-Conscious Treatments',
    desc: 'Targeted solutions designed with the environment in mind',
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Local Experts',
    desc: 'Technicians who know your area\'s pest challenges',
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export default function CleanFriendlyTrustBar() {
  return (
    <section className="bg-white border-b border-gray-100 py-6 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {SIGNALS.map((s, i) => (
          <div
            key={s.label}
            className="flex items-start gap-4"
            style={i > 0 ? { borderLeft: '1px solid #e5e7eb', paddingLeft: '1.5rem' } : undefined}
          >
            <div style={{ color: 'var(--color-primary)' }} className="flex-shrink-0 mt-0.5">
              {s.icon}
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--color-heading)' }}>{s.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
