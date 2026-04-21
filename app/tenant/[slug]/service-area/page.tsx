import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { notFound } from 'next/navigation';
import { resolveTenantBySlug } from '../../../../shared/lib/tenant/resolve';

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}
import { getAllLocations, getPageContent, getHeroMedia } from '../_lib/queries';
import { resolveHeroImage } from '../_lib/heroImage';
import { formatPhone } from '../../../../shared/lib/formatPhone';

type Params = { params: { slug: string } };

export default async function ServiceAreaPage({ params }: Params) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) notFound();

  const [rawLocs, content, heroMedia] = await Promise.all([
    getAllLocations(tenant.id),
    getPageContent(tenant.id, 'service-area'),
    getHeroMedia(tenant.id),
  ]);

  const c = content as { title?: string; subtitle?: string } | null;
  const heroTitle = c?.title    || 'Our Service Area';
  const heroSub   = c?.subtitle || 'Professional pest control in your community and surrounding areas.';
  const heroImageUrl = resolveHeroImage(content, heroMedia);

  type LocItem = { slug: string; city: string };
  const locations: LocItem[] = rawLocs as LocItem[];
  const phone = tenant.phone ?? '';
  const isCF = tenant.template === 'clean-friendly';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>

      <section className="relative py-20 md:py-28 px-6 text-center" style={heroImageUrl
        ? { backgroundImage: `url(${heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, var(--color-bg-hero, #0a1628) 0%, var(--color-bg-hero-end, var(--color-primary)) 100%)' }}>
        {heroImageUrl && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 0, pointerEvents: 'none' }} />}
        <div className="relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-white">{heroTitle}</h1>
          <p className="text-xl max-w-2xl mx-auto text-white/75">{heroSub}</p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10" style={{ color: 'var(--color-heading, #1a1a1a)' }}>Communities We Serve</h2>
          {locations.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {locations.map(loc => (
                <Link key={loc.slug} href={`/${loc.slug}`} className="flex items-center gap-2 bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition group">
                  <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
                  <span className="font-medium text-sm" style={{ color: 'var(--color-heading, #1a1a1a)' }}>{loc.city}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
              <MapPin className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-accent)' }} />
              <p style={{ color: 'var(--color-heading, #1a1a1a)' }}>Serving your area? Call us to confirm.</p>
            </div>
          )}
        </div>
      </section>

      {isCF ? (
        <section style={{ backgroundColor: 'var(--cf-bg-cream)', borderTop: '1px solid var(--cf-divider)', padding: '4rem 1.5rem', textAlign: 'center' }}>
          <div className="max-w-2xl mx-auto">
            <p style={{ fontFamily: "Georgia,'Source Serif Pro',serif", fontStyle: 'italic', fontSize: 14, color: 'var(--cf-ink-secondary)', marginBottom: '0.75rem' }}>need something nearby?</p>
            <h2 style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 'clamp(22px,3vw,32px)', color: 'var(--cf-ink)', marginBottom: '0.75rem', lineHeight: 1.2 }}>
              Don&apos;t see your city?
            </h2>
            <p style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 400, fontSize: 16, color: 'var(--cf-ink-secondary)', marginBottom: '2rem', lineHeight: 1.65 }}>
              We may still serve your area — give us a call to find out.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
              <Link href="/quote" style={{ display: 'inline-block', backgroundColor: 'var(--cf-ink)', color: 'var(--cf-surface)', fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 16, padding: '0.85rem 2rem', borderRadius: 28, textDecoration: 'none' }}>
                Get a free quote
              </Link>
              {phone && (
                <a href={`tel:${phone.replace(/\D/g, '')}`} style={{ display: 'inline-block', border: '1px solid var(--cf-ink)', color: 'var(--cf-ink)', fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 16, padding: '0.85rem 2rem', borderRadius: 28, textDecoration: 'none', backgroundColor: 'transparent' }}>
                  {formatPhone(phone)}
                </a>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-16 px-6 text-center" style={{ backgroundColor: 'var(--color-bg-cta, #0a1628)' }}>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Don&apos;t See Your City?</h2>
          <p className="mb-8 text-lg text-white/75">We may still serve your area — give us a call to find out.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {phone && (
              <a href={`tel:${phone.replace(/\D/g, '')}`} className="font-bold rounded-lg px-8 py-4 text-lg transition hover:opacity-90 text-white" style={{ backgroundColor: 'var(--color-accent)' }}>
                Call {formatPhone(phone)}
              </a>
            )}
            <Link href="/quote" className="font-bold rounded-lg px-8 py-4 text-lg transition hover:opacity-90 border-2 text-white" style={{ borderColor: 'var(--color-accent)' }}>
              Get a Free Quote
            </Link>
          </div>
        </section>
      )}

    </div>
  );
}
