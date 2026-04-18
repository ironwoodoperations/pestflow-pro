import type { Tenant } from '../../../../../shared/lib/tenant/types';
import { formatPhone } from '../../../../../shared/lib/formatPhone';

const DOT_BG: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)',
  backgroundSize: '22px 22px',
  backgroundColor: '#ffffff',
};

interface Props {
  tenant: Tenant;
  content: Record<string, unknown> | null;
  heroImageUrl: string | null;
}

export function RusticRuggedHero({ tenant, content, heroImageUrl }: Props) {
  const businessName = tenant.business_name || tenant.name;
  const phone = tenant.phone || '';
  const tagline = tenant.tagline || '';
  const address = (tenant as { address?: string }).address || '';
  const ctaText = tenant.cta_text || 'Get a Free Quote';
  const slug = tenant.slug;

  const heroHeadline = (content as { hero_headline?: string } | null)?.hero_headline?.trim() || '';
  const subtitle = (content as { subtitle?: string } | null)?.subtitle?.trim() || '';
  const city = address ? address.split(',')[0].trim() : null;

  return (
    <section
      className="relative flex flex-col md:flex-row min-h-[520px]"
      style={heroImageUrl
        ? { backgroundImage: `url(${heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
        : { background: `linear-gradient(135deg, var(--color-bg-hero) 0%, var(--color-bg-hero-end) 100%)` }}>
      {heroImageUrl && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 0, pointerEvents: 'none' }} />}
      <div className="md:w-[60%] flex flex-col justify-center px-8 md:px-14 py-16" style={{ ...DOT_BG, position: 'relative', zIndex: 1 }}>
        <h1 className="font-bold leading-tight mb-2" style={{ fontSize: 'clamp(32px,4.5vw,52px)', color: '#1a1a1a' }}>
          {heroHeadline || businessName || 'Expert Pest Control'}
        </h1>
        <p className="font-bold italic mb-4" style={{ fontSize: 'clamp(28px,3.5vw,44px)', color: 'var(--color-primary)', lineHeight: 1.1 }}>
          {subtitle || tagline || 'Pest Control'}
        </p>
        {city && <p className="text-gray-500 mb-2 text-sm">Serving {city} and the Surrounding Area</p>}
        {phone && (
          <a href={`tel:${phone.replace(/\D/g, '')}`} className="font-bold uppercase tracking-widest mb-6 text-sm inline-block" style={{ color: 'var(--color-primary)' }}>
            📞 CALL TODAY: {formatPhone(phone)}
          </a>
        )}
        <div className="flex gap-3 flex-wrap">
          <a href={`/tenant/${slug}/quote`} className="font-bold rounded px-7 py-3 text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>{ctaText}</a>
          <a href={`/tenant/${slug}/pest-control`} className="font-bold rounded px-7 py-3 text-white transition hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)', opacity: 0.8, border: '2px solid var(--color-primary)' }}>Our Services</a>
        </div>
      </div>
      <div className="md:w-[40%] flex items-center justify-center py-10 px-6" style={{ backgroundColor: '#f8f5f0', position: 'relative', zIndex: 1 }}>
        <div className="text-center text-gray-400 italic text-sm">
          <div className="text-5xl mb-4">🛡️</div>
          <p>Locally Owned &amp; Operated</p>
        </div>
      </div>
    </section>
  );
}
