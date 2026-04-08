import { Link } from 'react-router-dom'

interface CtaConfig { headline?: string; cta?: string }
interface Props { section: CtaConfig }

export default function CtaBannerSection({ section }: Props) {
  return (
    <section
      style={{ background: 'var(--color-bg-cta)' }}
      className="relative py-20 px-4 text-center overflow-hidden"
    >
      {/* Subtle radial glow overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 70%)',
        }}
      />
      <div className="relative z-10 max-w-2xl mx-auto">
        {section.headline && (
          <h2
            className="font-black text-3xl md:text-4xl mb-6 leading-tight"
            style={{ color: 'var(--color-heading)' }}
          >
            {section.headline}
          </h2>
        )}
        <Link
          to="/quote"
          style={{ background: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}
          className="inline-block px-10 py-4 rounded-lg font-bold text-lg hover:opacity-90 transition-opacity shadow-xl"
        >
          {section.cta || 'Get Your Free Quote'}
        </Link>
      </div>
    </section>
  )
}
