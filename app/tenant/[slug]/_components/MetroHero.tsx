import Link from 'next/link';
import type { Tenant } from '../../../../shared/lib/tenant/types';

const STRIPE = 'repeating-linear-gradient(15deg, transparent, transparent 30px, rgba(255,255,255,0.025) 30px, rgba(255,255,255,0.025) 60px)';

interface Props {
  tenant: Tenant;
  content: Record<string, unknown> | null;
  heroImageUrl?: string | null;
}

export function MetroHero({ tenant, content, heroImageUrl = null }: Props) {
  const c = content as { hero_headline?: string; title?: string; subtitle?: string } | null;

  const headline = c?.hero_headline?.trim()
    || c?.title?.trim()
    || (tenant.business_name ? `${tenant.business_name} — Professional Pest Control` : 'Professional Pest Control You Can Trust');

  const city = tenant.address ? tenant.address.split(',')[0].trim() : null;
  const fallbackSubtext = city
    ? `Serving ${city} and surrounding areas. Licensed, insured, and ready to help.`
    : 'Licensed, insured, and ready to protect your home and business.';
  const subtext = c?.subtitle || fallbackSubtext;

  const bgImage = heroImageUrl;

  return (
    <section
      id="main-content"
      className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden"
      style={
        bgImage
          ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', position: 'relative' }
          : { background: `${STRIPE}, linear-gradient(135deg, var(--color-bg-hero, #0a1628) 0%, var(--color-bg-hero-end, var(--color-primary, #1565C0)) 100%)`, position: 'relative' }
      }
    >
      {bgImage && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 0, pointerEvents: 'none' }} />}
      {bgImage && <div className="absolute inset-0 pointer-events-none" style={{ background: STRIPE }} />}
      <div className="relative z-10 max-w-4xl mx-auto text-center py-20">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight tracking-tight mb-4">{headline}</h1>
        <div className="w-16 h-1 mx-auto mb-6" style={{ backgroundColor: 'var(--color-accent)' }} />
        <p className="text-xl max-w-2xl mx-auto mb-10" style={{ color: 'rgba(255,255,255,0.70)' }}>{String(subtext)}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/quote" className="font-bold px-10 py-4 text-white text-sm uppercase tracking-widest transition hover:opacity-90" style={{ backgroundColor: 'var(--color-accent)' }}>
            {tenant.cta_text || 'Get Free Quote'}
          </Link>
          {tenant.phone && (
            <a href={`tel:${tenant.phone.replace(/\D/g, '')}`} className="font-bold px-10 py-4 text-sm uppercase tracking-widest border border-white/40 text-white hover:bg-white/10 transition">
              Call Now
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
