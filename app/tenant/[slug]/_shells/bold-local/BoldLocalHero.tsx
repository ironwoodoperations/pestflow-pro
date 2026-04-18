import Link from 'next/link';
import type { Tenant } from '../../../../../shared/lib/tenant/types';
import { formatPhone } from '../../../../../shared/lib/formatPhone';

interface Props {
  tenant: Tenant;
  content: Record<string, unknown> | null;
  heroImageUrl?: string | null;
}

export function BoldLocalHero({ tenant, content, heroImageUrl }: Props) {
  const bizName = tenant.business_name || tenant.name;
  const phone = tenant.phone ?? '';
  const ctaText = tenant.cta_text || 'Get a Free Quote';

  const c = content as { hero_headline?: string; title?: string; subtitle?: string } | null;
  const headline = c?.hero_headline?.trim() || c?.title?.trim()
    || (bizName ? `${bizName} — Expert Pest Control` : 'Expert Pest Control You Can Count On');
  const subtitle = c?.subtitle?.trim()
    || tenant.tagline
    || 'Professional and personalized service for your home and business';

  const bgStyle = heroImageUrl
    ? { backgroundImage: `url(${heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
    : { background: 'linear-gradient(135deg, var(--color-bg-hero, #2d1a00) 0%, var(--color-bg-hero-end, #1a0f00) 100%)' };

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ ...bgStyle, position: 'relative' }}
    >
      {heroImageUrl && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 0, pointerEvents: 'none' }} />}
      <div className="relative z-10 flex items-center justify-center px-4 w-full py-16">
        <div className="text-center w-full" style={{ background: 'rgba(0,0,0,0.72)', borderRadius: '16px', padding: '48px 40px', maxWidth: '640px' }}>
          <h1 className="font-bold text-white" style={{ fontSize: 'clamp(28px,5vw,48px)', lineHeight: 1.2, marginBottom: '16px' }}>
            {headline}
          </h1>
          <p style={{ color: 'white', opacity: 0.9, marginBottom: '32px', fontSize: '18px', lineHeight: 1.6 }}>{subtitle}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/quote" className="font-bold rounded-full px-8 py-3 transition hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}>
              {ctaText}
            </Link>
            {phone && (
              <a href={`tel:${phone.replace(/\D/g, '')}`}
                className="font-semibold rounded-full px-8 py-3 transition hover:bg-white hover:opacity-90"
                style={{ border: '2px solid white', color: 'white' }}>
                Call {formatPhone(phone)}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
