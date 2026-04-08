interface WhyConfig {
  variant?: 'icons' | 'checklist' | 'numbered'
  headline?: string
  points?: string[]
}
interface Props { section: WhyConfig }

const DEFAULT_POINTS = [
  'Licensed, bonded & insured professionals',
  'Same-day and emergency service available',
  'Eco-friendly, family-safe treatments',
  'Guaranteed results or we return for free',
]

const POINT_ICONS = ['🛡️', '⚡', '🌿', '💯', '📋', '🏆', '✅', '🔬']

export default function WhyChooseUsSection({ section }: Props) {
  const points = section.points?.length ? section.points : DEFAULT_POINTS
  const v = section.variant || 'icons'

  return (
    <section style={{ background: 'var(--color-bg-section)' }} className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {section.headline && (
          <h2 className="text-3xl font-black text-center mb-10"
            style={{ color: 'var(--color-heading)' }}>
            {section.headline}
          </h2>
        )}

        {v === 'icons' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {points.map((point, i) => (
              <div key={i}
                className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow">
                <div className="text-4xl mb-3">{POINT_ICONS[i % POINT_ICONS.length]}</div>
                <p className="font-semibold text-sm leading-snug"
                  style={{ color: 'var(--color-heading)' }}>
                  {point}
                </p>
              </div>
            ))}
          </div>
        )}

        {v === 'checklist' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {points.map((point, i) => (
              <div key={i} className="flex items-start gap-3">
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--color-accent)', color: 'var(--color-btn-text)' }}
                >
                  ✓
                </span>
                <span className="text-base leading-snug"
                  style={{ color: 'var(--color-heading)' }}>
                  {point}
                </span>
              </div>
            ))}
          </div>
        )}

        {v === 'numbered' && (
          <div className="space-y-6">
            {points.map((point, i) => (
              <div key={i} className="flex items-start gap-5">
                <span
                  className="text-4xl font-black leading-none flex-shrink-0 w-12 text-center"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 pt-1">
                  <p className="text-base leading-relaxed font-medium"
                    style={{ color: 'var(--color-heading)' }}>
                    {point}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
