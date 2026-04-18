interface Props { certifications?: string; tagline?: string }

export function BoldLocalTrustBar({ certifications, tagline }: Props) {
  const items = [
    { icon: '📍', text: 'Locally Owned & Operated' },
    { icon: '✓', text: certifications ? `Licensed: ${certifications}` : 'Licensed & Certified' },
    { icon: '⚡', text: tagline || 'Same-Day Service Available' },
  ];
  return (
    <div className="py-3 px-4" style={{ backgroundColor: 'var(--color-primary)' }}>
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-1">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--color-text-on-primary)' }}>
            <span aria-hidden="true">{item.icon}</span>
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}
