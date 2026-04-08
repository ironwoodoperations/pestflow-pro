import { Link } from 'react-router-dom'

interface CtaConfig { headline?: string; cta?: string }
interface Props { section: CtaConfig }

export default function CtaBannerSection({ section }: Props) {
  return (
    <section style={{ background: 'var(--color-bg-cta)' }} className="py-16 px-4 text-center">
      {section.headline && (
        <h2 className="font-black text-3xl mb-6" style={{ color: 'var(--color-heading)' }}>
          {section.headline}
        </h2>
      )}
      <Link to="/contact"
        style={{ background: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}
        className="inline-block px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition shadow-lg">
        {section.cta || 'Contact Us'}
      </Link>
    </section>
  )
}
