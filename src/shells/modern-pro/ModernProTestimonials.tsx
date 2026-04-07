const REVIEWS = [
  {
    quote: "I've tried other pest control companies before, but none of them compare. They showed up on time, explained everything they were doing, and I haven't seen a single bug since. Highly recommend.",
    name: 'Sarah M.',
    detail: 'Homeowner — Verified Customer',
  },
  {
    quote: 'Called them on a Friday afternoon with a bad roach problem. They were at my house the next morning. Professional, thorough, and the pricing was very fair. Will definitely use them again.',
    name: 'James R.',
    detail: 'Homeowner — Verified Customer',
  },
  {
    quote: "Been a customer for two years now on the quarterly plan. Best decision I made as a homeowner. Zero pest issues and they always send a reminder before the visit. Great company.",
    name: 'Linda K.',
    detail: 'Quarterly Plan Customer',
  },
]

export default function ModernProTestimonials() {
  return (
    <section style={{ background: 'var(--color-bg-cta)' }} className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#ffffff' }}>
            TESTIMONIALS
          </p>
          <h2 className="text-3xl font-bold" style={{ color: '#ffffff' }}>
            What Our Customers Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((r) => (
            <div
              key={r.name}
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <div className="text-lg mb-3" style={{ color: '#fbbf24' }}>★★★★★</div>
              <p className="text-sm italic leading-relaxed mb-4" style={{ color: '#ffffff' }}>
                "{r.quote}"
              </p>
              <p className="font-semibold" style={{ color: '#ffffff' }}>{r.name}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{r.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
