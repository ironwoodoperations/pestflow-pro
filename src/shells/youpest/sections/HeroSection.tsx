import { Link } from 'react-router-dom'

interface HeroConfig {
  variant?: 'full-bleed' | 'split' | 'centered' | 'video-bg'
  headline?: string
  subheadline?: string
  cta?: string
  bg?: 'primary' | 'accent' | 'dark' | 'light' | 'image'
}

interface Props { section: HeroConfig }

export default function HeroSection({ section }: Props) {
  const bg = section.bg === 'light'
    ? 'var(--color-bg-section)'
    : section.bg === 'accent'
      ? 'var(--color-accent)'
      : 'var(--color-bg-hero)'

  return (
    <section style={{ background: bg }} className="py-24 px-4">
      <div className={`max-w-5xl mx-auto ${section.variant === 'centered' || !section.variant ? 'text-center' : ''}`}>
        {section.headline && (
          <h1 className="font-black text-5xl md:text-6xl leading-tight mb-6"
            style={{ color: 'var(--color-heading)' }}>
            {section.headline}
          </h1>
        )}
        {section.subheadline && (
          <p className="text-lg mb-10 max-w-xl mx-auto opacity-80"
            style={{ color: 'var(--color-heading)' }}>
            {section.subheadline}
          </p>
        )}
        <Link to="/contact"
          style={{ background: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}
          className="inline-block px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition shadow-lg">
          {section.cta || 'Get a Free Quote'}
        </Link>
      </div>
    </section>
  )
}
