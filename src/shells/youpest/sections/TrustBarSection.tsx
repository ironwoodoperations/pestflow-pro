interface TrustBarConfig { items?: string[] }
interface Props { section: TrustBarConfig }

export default function TrustBarSection({ section }: Props) {
  const items = section.items || ['Licensed & Insured', 'Family Owned', 'Same-Day Service', '5-Star Rated']
  return (
    <section style={{ background: 'var(--color-bg-section)' }} className="py-8 px-4 border-y border-black/10">
      <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-6">
        {items.map((item) => (
          <span key={item} className="flex items-center gap-2 text-sm font-semibold"
            style={{ color: 'var(--color-heading)' }}>
            <span style={{ color: 'var(--color-accent)' }}>✓</span> {item}
          </span>
        ))}
      </div>
    </section>
  )
}
