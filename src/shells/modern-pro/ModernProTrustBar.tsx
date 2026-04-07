export default function ModernProTrustBar() {
  const signals = [
    {
      icon: (
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      label: 'Licensed & Insured',
      desc: 'Fully licensed, bonded, and insured for your protection',
    },
    {
      icon: (
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      label: 'Satisfaction Guaranteed',
      desc: 'We re-treat for free if pests return between visits',
    },
    {
      icon: (
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      label: 'Local Experts',
      desc: 'Serving your community with local knowledge and care',
    },
  ]

  return (
    <section style={{ background: 'var(--color-primary)' }} className="py-8 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3">
        {signals.map((s, i) => (
          <div
            key={s.label}
            className="flex flex-col items-center text-center px-6 py-4"
            style={i < 2 ? { borderRight: '1px solid rgba(255,255,255,0.2)' } : undefined}
          >
            <div className="mb-3">{s.icon}</div>
            <div className="font-bold text-lg mb-1" style={{ color: '#ffffff' }}>{s.label}</div>
            <div className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.82)' }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
