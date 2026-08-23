import Link from 'next/link';

// 5b: fully prop-driven. Tiles, eyebrow, and headings come from the tenant's
// own data — no service list, no image map, and no fallback copy live here.
export interface ServiceTile { name: string; slug: string; image?: string }

interface Props {
  services: ServiceTile[];
  eyebrow: string;
  heading: string;
  subheading?: string;
}

export function ModernProServicesGrid({ services, eyebrow, heading, subheading }: Props) {
  return (
    <section style={{ background: 'var(--color-bg-section)' }} className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest mb-2"
             style={{ color: 'var(--color-primary)' }}>
            {eyebrow}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-3"
              style={{ color: 'var(--color-heading)' }}>
            {heading}
          </h2>
          {subheading && (
            <p className="text-base" style={{ color: 'var(--color-text-muted, #6b7280)' }}>
              {subheading}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {(services ?? []).map((s) => (
            <Link
              key={s.slug}
              href={`/${s.slug}`}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer group"
            >
              {s.image ? (
                <img
                  src={s.image}
                  alt={s.name}
                  loading="lazy"
                  className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div
                  className="w-full h-36 flex items-center justify-center px-4 text-center"
                  style={{ background: 'var(--color-bg-section)' }}
                >
                  <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>
                    {s.name}
                  </span>
                </div>
              )}
              <div className="p-3 text-center">
                <span className="font-semibold text-sm" style={{ color: 'var(--color-heading)' }}>
                  {s.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
