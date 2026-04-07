const REVIEWS = [
  {
    quote: "Extremely professional and thorough. They explained exactly what they were using and why, and I haven't had a single pest issue since. My family feels safe and that means everything.",
    name: 'Jennifer A.',
    detail: 'Homeowner — Verified Customer',
  },
  {
    quote: 'Called with a bad ant problem on a Wednesday. They were out Thursday morning and fixed it completely. Friendly technician, fair price. We signed up for the quarterly plan on the spot.',
    name: 'Marcus T.',
    detail: 'Homeowner — Verified Customer',
  },
  {
    quote: "Been with them for over a year now. They always call ahead, show up on time, and my house has never been pest-free like this. Couldn't recommend them more highly.",
    name: 'Patricia W.',
    detail: 'Quarterly Plan Customer',
  },
]

export default function CleanFriendlyTestimonials() {
  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2"
             style={{ color: 'var(--color-primary)' }}>TESTIMONIALS</p>
          <h2 className="text-3xl font-bold" style={{ color: 'var(--color-heading)' }}>
            What Our Customers Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map(r => (
            <div key={r.name}
                 className="rounded-2xl p-6 border border-gray-100"
                 style={{ background: 'var(--color-bg-section)' }}>
              <div className="text-lg mb-3" style={{ color: 'var(--color-accent)' }}>★★★★★</div>
              <p className="text-sm italic leading-relaxed mb-4 text-gray-600">
                "{r.quote}"
              </p>
              <p className="font-semibold text-sm" style={{ color: 'var(--color-heading)' }}>{r.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{r.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
