interface AboutConfig {
  variant?: 'left-image' | 'right-image' | 'centered'
  headline?: string
  body?: string
}
interface Props { section: AboutConfig }

export default function AboutStripSection({ section }: Props) {
  return (
    <section style={{ background: 'var(--color-bg-section)' }} className="py-16 px-4">
      <div className={`max-w-4xl mx-auto ${section.variant === 'centered' ? 'text-center' : ''}`}>
        {section.headline && (
          <h2 className="text-3xl font-black mb-6" style={{ color: 'var(--color-heading)' }}>
            {section.headline}
          </h2>
        )}
        {section.body && (
          <p className="text-lg leading-relaxed opacity-80" style={{ color: 'var(--color-heading)' }}>
            {section.body}
          </p>
        )}
      </div>
    </section>
  )
}
