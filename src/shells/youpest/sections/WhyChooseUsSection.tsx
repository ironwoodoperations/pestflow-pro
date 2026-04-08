interface WhyConfig {
  variant?: 'icons' | 'checklist' | 'numbered'
  headline?: string
  points?: string[]
}
interface Props { section: WhyConfig }

export default function WhyChooseUsSection({ section }: Props) {
  const points = section.points || []
  return (
    <section style={{ background: 'var(--color-bg-section)' }} className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {section.headline && (
          <h2 className="text-3xl font-black text-center mb-10" style={{ color: 'var(--color-heading)' }}>
            {section.headline}
          </h2>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {points.map((point, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-xl"
              style={{ background: 'var(--color-bg-hero)' }}>
              <span className="font-bold text-lg shrink-0" style={{ color: 'var(--color-accent)' }}>
                {section.variant === 'numbered' ? `${i + 1}.` : '✓'}
              </span>
              <span style={{ color: 'var(--color-heading)' }}>{point}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
