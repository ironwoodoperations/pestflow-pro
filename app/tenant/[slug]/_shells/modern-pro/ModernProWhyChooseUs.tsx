interface Props { businessName: string }

const CARDS = [
  {
    icon: '🛡️',
    heading: 'Guaranteed Results',
    desc: 'If pests return between scheduled treatments, we come back at no additional charge. Your satisfaction is our promise.',
  },
  {
    icon: '🌿',
    heading: 'Family & Pet Safe',
    desc: 'We use treatments that are tough on pests and safe for the people and pets you love. No compromises.',
  },
  {
    icon: '⚡',
    heading: 'Fast Response',
    desc: "Same-day and next-day appointments available. When you have a pest problem, we don't make you wait.",
  },
];

export function ModernProWhyChooseUs({ businessName }: Props) {
  return (
    <section style={{ background: 'var(--color-bg-section)' }} className="py-16 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2"
           style={{ color: 'var(--color-primary)' }}>
          WHY CHOOSE US
        </p>
        <h2 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--color-heading)' }}>
          The {businessName || 'Local Pest Control'} Difference
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-10">
        {CARDS.map((card) => (
          <div
            key={card.heading}
            className="bg-white rounded-2xl shadow-sm p-8 border-t-4"
            style={{ borderColor: 'var(--color-primary)' }}
          >
            <div className="text-4xl mb-4">{card.icon}</div>
            <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--color-heading)' }}>
              {card.heading}
            </h3>
            <p className="leading-relaxed text-sm" style={{ color: '#6b7280' }}>
              {card.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
