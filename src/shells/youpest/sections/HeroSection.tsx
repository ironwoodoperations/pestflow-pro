import { Link } from 'react-router-dom'

interface HeroConfig {
  variant?: 'full-bleed' | 'split' | 'centered' | 'video-bg'
  headline?: string
  subheadline?: string
  cta?: string
  bg?: 'primary' | 'accent' | 'dark' | 'light' | 'image'
}

interface Props { section: HeroConfig }

function getBg(bg?: string) {
  if (bg === 'light')  return 'var(--color-bg-section)'
  if (bg === 'accent') return 'var(--color-accent)'
  if (bg === 'dark')   return undefined // handled via Tailwind
  return 'var(--color-bg-hero)'
}

function isDarkBg(bg?: string) {
  return !bg || bg === 'primary' || bg === 'dark' || bg === 'accent'
}

export default function HeroSection({ section }: Props) {
  const v = section.variant || 'full-bleed'
  const bg = getBg(section.bg)
  const dark = isDarkBg(section.bg)
  const headingColor = dark ? 'white' : 'var(--color-heading)'
  const subColor = dark ? 'rgba(255,255,255,0.78)' : 'var(--color-heading)'
  const cta = section.cta || 'Get a Free Quote'

  // full-bleed + video-bg share the same full-screen layout
  if (v === 'full-bleed' || v === 'video-bg') {
    // TODO: wire video_url from page_content when available
    const isVideo = v === 'video-bg'
    return (
      <section
        className={`relative min-h-screen flex items-center justify-center ${isVideo || section.bg === 'dark' ? 'bg-gray-900' : ''}`}
        style={!isVideo && section.bg !== 'dark' ? { background: `linear-gradient(135deg, var(--color-bg-hero) 0%, var(--color-bg-hero-end, var(--color-bg-hero)) 100%)` } : undefined}
      >
        {isVideo && <div className="absolute inset-0 bg-black/60" />}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6 py-20">
          {section.headline && (
            <h1 className="font-black text-4xl md:text-6xl leading-tight mb-6"
              style={{ color: isVideo ? 'white' : headingColor }}>
              {section.headline}
            </h1>
          )}
          {section.subheadline && (
            <p className="text-xl mb-10 max-w-2xl mx-auto"
              style={{ color: isVideo ? 'rgba(255,255,255,0.80)' : subColor }}>
              {section.subheadline}
            </p>
          )}
          <Link to="/quote"
            style={{ background: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}
            className="inline-block px-8 py-3 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity shadow-xl">
            {cta}
          </Link>
        </div>
      </section>
    )
  }

  if (v === 'split') {
    return (
      <section
        style={{ background: bg || 'var(--color-bg-hero)' }}
        className="min-h-[70vh]"
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 min-h-[70vh]">
          <div className="flex flex-col justify-center px-8 py-16 md:py-24 order-2 md:order-1">
            {section.headline && (
              <h1 className="font-black text-4xl md:text-5xl leading-tight mb-5"
                style={{ color: headingColor }}>
                {section.headline}
              </h1>
            )}
            {section.subheadline && (
              <p className="text-lg mb-8" style={{ color: subColor }}>
                {section.subheadline}
              </p>
            )}
            <Link to="/quote"
              style={{ background: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}
              className="self-start px-8 py-3 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg">
              {cta}
            </Link>
          </div>
          <div className="min-h-[280px] md:min-h-0 order-1 md:order-2">
            <img
              src="/images/pests/pest_control.jpg"
              alt="Pest control technician"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>
    )
  }

  // centered
  const centeredBg = section.bg === 'light' ? 'var(--color-bg-section)' : bg || 'var(--color-bg-section)'
  const centeredDark = section.bg && section.bg !== 'light'
  return (
    <section
      style={{ background: centeredBg }}
      className="min-h-[60vh] flex items-center justify-center py-16 px-4"
    >
      <div className="text-center max-w-3xl mx-auto">
        {section.headline && (
          <h1 className="font-black text-4xl md:text-5xl leading-tight mb-5"
            style={{ color: centeredDark ? headingColor : 'var(--color-heading)' }}>
            {section.headline}
          </h1>
        )}
        {section.subheadline && (
          <p className="text-xl mb-8 opacity-75"
            style={{ color: centeredDark ? subColor : 'var(--color-heading)' }}>
            {section.subheadline}
          </p>
        )}
        <Link to="/quote"
          style={{ background: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}
          className="inline-block px-8 py-3 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg">
          {cta}
        </Link>
      </div>
    </section>
  )
}
