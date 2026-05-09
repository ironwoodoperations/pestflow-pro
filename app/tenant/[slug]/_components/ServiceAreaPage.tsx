import Link from 'next/link';
import { formatPhone } from '../../../../shared/lib/formatPhone';

type Location = { city: string; state?: string | null; slug: string };

interface Props {
  heroTitle: string;
  heroSub: string;
  locations: Location[];
  phone: string;
  businessName: string;
}

const PinIcon = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M12 21s-7-7.5-7-12a7 7 0 1 1 14 0c0 4.5-7 12-7 12Z" fill="var(--color-accent)" stroke="var(--color-accent)" strokeWidth={1} strokeLinejoin="round" />
    <circle cx={12} cy={9} r={2.6} fill="#fff" />
  </svg>
);

function locationLabel(loc: Location) {
  const state = loc.state?.trim();
  return state ? `${loc.city}, ${state}` : loc.city;
}

export function ServiceAreaPage({ heroTitle, heroSub, locations, phone, businessName }: Props) {
  return (
    <div style={{ backgroundColor: 'var(--color-bg-section)' }}>
      {/* Hero */}
      <section
        className="relative py-20 md:py-28 px-6 text-center"
        style={{ background: 'linear-gradient(135deg, var(--color-bg-hero) 0%, var(--color-bg-hero-end, var(--color-primary)) 100%)' }}
      >
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-4" style={{ color: 'var(--color-text-on-primary, #ffffff)', fontFamily: 'var(--font-heading)' }}>
            {heroTitle}
          </h1>
          <p className="text-lg md:text-xl" style={{ color: 'var(--color-text-on-primary, #ffffff)', opacity: 0.85, fontFamily: 'var(--font-body)' }}>
            {heroSub}
          </p>
        </div>
      </section>

      {/* Map */}
      <section className="py-12 px-6" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <div className="max-w-5xl mx-auto">
          <div
            className="rounded-xl overflow-hidden border"
            style={{ borderColor: 'color-mix(in srgb, var(--color-heading) 12%, transparent)', backgroundColor: 'color-mix(in srgb, var(--color-bg-section) 92%, var(--color-heading) 8%)' }}
          >
            <img
              src="/demo-coverage-map.svg"
              alt={`${businessName} service area`}
              loading="lazy"
              style={{ display: 'block', width: '100%', height: 'auto' }}
            />
          </div>
        </div>
      </section>

      {/* City card grid */}
      <section className="pb-16 px-6" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-2xl md:text-3xl font-bold text-center mb-8"
            style={{ color: 'var(--color-heading)', fontFamily: 'var(--font-heading)' }}
          >
            Communities We Serve
          </h2>
          {locations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {locations.map((loc) => {
                const label = locationLabel(loc);
                return (
                  <Link
                    key={loc.slug}
                    href={`/${loc.slug}`}
                    aria-label={`Pest control in ${label}`}
                    className="group flex items-center gap-3 rounded-xl p-4 border transition hover:shadow-md"
                    style={{
                      backgroundColor: 'var(--color-text-on-primary, #ffffff)',
                      borderColor: 'color-mix(in srgb, var(--color-heading) 10%, transparent)',
                    }}
                  >
                    <PinIcon />
                    <span
                      className="font-medium text-sm"
                      style={{ color: 'var(--color-heading)', fontFamily: 'var(--font-body)' }}
                    >
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div
              className="rounded-xl p-8 text-center border"
              style={{
                backgroundColor: 'var(--color-text-on-primary, #ffffff)',
                borderColor: 'color-mix(in srgb, var(--color-heading) 10%, transparent)',
                color: 'var(--color-heading)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Serving your area? Call us to confirm.
            </div>
          )}
        </div>
      </section>

      {/* CTA strip */}
      <section className="py-16 px-6 text-center" style={{ backgroundColor: 'var(--color-bg-cta, var(--color-bg-hero))' }}>
        <h2
          className="text-3xl md:text-4xl font-bold mb-3"
          style={{ color: 'var(--color-text-on-primary, #ffffff)', fontFamily: 'var(--font-heading)' }}
        >
          Don&apos;t See Your City?
        </h2>
        <p className="mb-8 text-lg" style={{ color: 'var(--color-text-on-primary, #ffffff)', opacity: 0.8, fontFamily: 'var(--font-body)' }}>
          We may still serve your area — give us a call to find out.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {phone && (
            <a
              href={`tel:${phone.replace(/\D/g, '')}`}
              className="font-bold rounded-lg px-8 py-4 text-base md:text-lg transition hover:opacity-90"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-btn-text, #ffffff)' }}
            >
              Call {formatPhone(phone)}
            </a>
          )}
          <Link
            href="/quote"
            className="font-bold rounded-lg px-8 py-4 text-base md:text-lg transition hover:bg-white/10"
            style={{ border: '2px solid var(--color-accent)', color: 'var(--color-text-on-primary, #ffffff)' }}
          >
            Get a Free Quote
          </Link>
        </div>
      </section>
    </div>
  );
}
