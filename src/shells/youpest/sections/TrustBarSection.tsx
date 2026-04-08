interface TrustBarConfig { items?: string[] }
interface Props { section: TrustBarConfig }

export default function TrustBarSection({ section }: Props) {
  const items = section.items || [
    'Licensed & Insured',
    'Family Owned & Operated',
    'Same-Day Service Available',
    '5-Star Rated',
  ]

  return (
    <section
      style={{
        background: 'var(--color-nav-bg)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
      className="py-5 px-4"
    >
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:flex md:flex-wrap md:justify-center gap-x-10 gap-y-3">
        {items.map((item) => (
          <span
            key={item}
            className="flex items-center gap-2.5 text-sm font-semibold"
            style={{ color: 'var(--color-nav-text)' }}
          >
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0"
              style={{ background: 'var(--color-accent)', color: 'var(--color-btn-text)' }}
            >
              ✓
            </span>
            {item}
          </span>
        ))}
      </div>
    </section>
  )
}
