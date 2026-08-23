// 5b: prop-driven. Cards are tenant copy passed in from page.tsx; tenants
// with no configured items pass [] and the section renders nothing.
export interface WhyChooseItem { title: string; body: string }

interface Props {
  businessName: string;
  items: WhyChooseItem[];
}

export function ModernProWhyChooseUs({ businessName, items }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <section style={{ background: 'var(--color-bg-section)' }} className="py-16 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2"
           style={{ color: 'var(--color-primary)' }}>
          WHY CHOOSE US
        </p>
        <h2 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--color-heading)' }}>
          The {businessName} Difference
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-10">
        {items.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-2xl shadow-sm p-8 border-t-4"
            style={{ borderColor: 'var(--color-primary)' }}
          >
            <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--color-heading)' }}>
              {card.title}
            </h3>
            <p className="leading-relaxed text-sm" style={{ color: '#6b7280' }}>
              {card.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
