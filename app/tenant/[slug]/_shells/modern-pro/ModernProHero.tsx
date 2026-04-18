import Link from 'next/link';
import type { Tenant } from '../../../../../shared/lib/tenant/types';

interface Props {
  tenant: Tenant;
  content: Record<string, unknown> | null;
  heroImageUrl?: string | null;
}

export function ModernProHero({ tenant, content, heroImageUrl = null }: Props) {
  const c = content as { hero_headline?: string; title?: string; subtitle?: string; intro?: string } | null;

  const headline = c?.hero_headline?.trim()
    || c?.title?.trim()
    || tenant.business_name?.trim()
    || 'Professional Pest Control You Can Trust';

  const city = tenant.address ? tenant.address.split(',')[0].trim() : null;
  const fallbackSubtext = city
    ? `Serving ${city} and surrounding areas. Licensed, insured, and ready to help.`
    : 'Licensed, insured, and ready to protect your home.';
  const subtext = c?.intro || c?.subtitle || fallbackSubtext;

  const trustParts: string[] = [];
  trustParts.push('Licensed & Insured');
  if (tenant.num_technicians) trustParts.push(`${tenant.num_technicians}+ Technicians`);
  if (tenant.founded_year) trustParts.push(`Est. ${tenant.founded_year}`);

  return (
    <section
      id="main-content"
      className="relative text-white min-h-screen flex items-center justify-center px-4 overflow-hidden"
      style={heroImageUrl ? {
        backgroundImage: `url(${heroImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
      } : {
        background: 'linear-gradient(135deg, var(--color-bg-hero) 0%, var(--color-bg-hero-end) 100%)',
        position: 'relative',
      }}
    >
      {heroImageUrl && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 0, pointerEvents: 'none' }} />
      )}
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        {tenant.tagline && (
          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ color: '#ffffff', border: '1px solid rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.1)' }}>
            {tenant.tagline}
          </span>
        )}
        <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">{headline}</h1>
        <p className="text-lg mt-4 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.85)' }}>{String(subtext)}</p>
        <div className="flex flex-wrap gap-4 justify-center mt-8">
          <Link href="/quote" style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }} className="font-semibold px-8 py-3 rounded-lg transition">
            {tenant.cta_text || 'Get a Free Quote'}
          </Link>
          {tenant.phone && (
            <a href={`tel:${tenant.phone.replace(/\D/g, '')}`} className="border border-white text-white hover:bg-white/10 px-8 py-3 rounded-lg font-semibold transition">
              Call Now
            </a>
          )}
        </div>
        <p className="mt-6 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{trustParts.join(' · ')}</p>
      </div>
    </section>
  );
}
