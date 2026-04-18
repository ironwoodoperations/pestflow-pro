interface Props { businessName: string }

const CARDS = [
  {
    heading: 'Pet & Family Safe',
    desc: 'Applied with care for the people and pets you love. Our treatments are targeted and responsible.',
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    heading: 'Eco-Conscious',
    desc: 'Targeted treatments designed with the environment in mind — effective without unnecessary chemicals.',
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    heading: 'Local Experts',
    desc: "Technicians who understand your area's unique pest challenges — because we live here too.",
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export function CleanFriendlyWhyChooseUs({ businessName }: Props) {
  return (
    <section style={{ background: 'var(--color-bg-section)' }} className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--color-primary)' }}>WHY CHOOSE US</p>
          <h2 className="text-3xl font-bold" style={{ color: 'var(--color-heading)' }}>
            Why Choose {businessName || 'Us'}?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CARDS.map(card => (
            <div key={card.heading} className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
              <div className="mb-4" style={{ color: 'var(--color-primary)' }}>{card.icon}</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-heading)' }}>
                {card.heading}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
