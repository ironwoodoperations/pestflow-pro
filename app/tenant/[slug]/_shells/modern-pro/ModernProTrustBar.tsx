// 5b: prop-driven. Trust claims are tenant facts passed in from page.tsx —
// nothing is asserted here by default. Tenants with no configured items pass
// [] and the bar renders nothing, never fallback claims.
export interface TrustItem { label: string; sublabel?: string }

interface Props { items: TrustItem[] }

export function ModernProTrustBar({ items }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <section style={{ background: 'var(--color-primary)' }} className="py-8 px-6">
      <div
        className="max-w-6xl mx-auto grid gap-y-6"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
      >
        {items.map((s) => (
          <div key={s.label} className="flex flex-col items-center text-center px-6 py-4">
            <div className="font-bold text-lg mb-1" style={{ color: '#ffffff' }}>{s.label}</div>
            {s.sublabel && (
              <div className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.82)' }}>{s.sublabel}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
