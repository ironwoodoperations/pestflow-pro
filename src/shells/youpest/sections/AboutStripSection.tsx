import { Link } from 'react-router-dom'

interface AboutConfig {
  variant?: 'left-image' | 'right-image' | 'centered'
  headline?: string
  body?: string
  cta?: string
}
interface Props { section: AboutConfig }

const PLACEHOLDER = '/images/pests/pest_control.jpg'

export default function AboutStripSection({ section }: Props) {
  const v = section.variant || 'left-image'
  const cta = section.cta

  if (v === 'centered') {
    return (
      <section style={{ background: 'var(--color-bg-section)' }} className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          {section.headline && (
            <h2 className="text-3xl font-black mb-5" style={{ color: 'var(--color-heading)' }}>
              {section.headline}
            </h2>
          )}
          {section.body && (
            <p className="text-lg leading-relaxed opacity-80 mb-6" style={{ color: 'var(--color-heading)' }}>
              {section.body}
            </p>
          )}
          {cta && (
            <Link to="/about"
              style={{ background: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}
              className="inline-block px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
              {cta}
            </Link>
          )}
        </div>
      </section>
    )
  }

  const imageRight = v === 'right-image'

  return (
    <section style={{ background: 'var(--color-bg-section)' }} className="py-0 overflow-hidden">
      <div className={`max-w-6xl mx-auto flex flex-col ${imageRight ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
        {/* Text side */}
        <div className="flex-1 flex flex-col justify-center px-8 py-16 md:py-20">
          {section.headline && (
            <h2 className="text-3xl font-black mb-5" style={{ color: 'var(--color-heading)' }}>
              {section.headline}
            </h2>
          )}
          {section.body && (
            <p className="text-lg leading-relaxed opacity-80 mb-6" style={{ color: 'var(--color-heading)' }}>
              {section.body}
            </p>
          )}
          {cta && (
            <Link to="/about"
              style={{ background: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}
              className="self-start px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-md">
              {cta}
            </Link>
          )}
        </div>
        {/* Image side */}
        <div className="flex-1 min-h-[280px] md:min-h-[420px]">
          <img
            src={PLACEHOLDER}
            alt="About our pest control team"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  )
}
