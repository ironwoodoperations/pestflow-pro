import ServicesGrid from '../../../components/public/ServicesGrid'

interface ServicesConfig {
  variant?: 'cards' | 'icon-list' | 'large-tiles'
  headline?: string
}
interface Props { section: ServicesConfig }

export default function ServicesGridSection({ section }: Props) {
  return (
    <section style={{ background: 'var(--color-bg-section)' }} className="py-16 px-4">
      {section.headline && (
        <h2 className="text-3xl font-black text-center mb-10"
          style={{ color: 'var(--color-heading)' }}>
          {section.headline}
        </h2>
      )}
      <ServicesGrid />
    </section>
  )
}
