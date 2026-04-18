import Link from 'next/link';
import type { Tenant } from '../../../../../shared/lib/tenant/types';
import { formatPhone } from '../../../../../shared/lib/formatPhone';

interface Props {
  tenant: Tenant;
  content: Record<string, unknown> | null;
  heroImageUrl?: string | null;
}

const STRIPS = [
  { icon: '🏠', title: 'Residential', sub: 'Protecting your home and family', href: '/pest-control' },
  { icon: '🏢', title: 'Commercial', sub: 'Keeping your business pest-free', href: '/pest-control' },
  { icon: '🪲', title: 'Termites', sub: 'Full termite inspection & treatment', href: '/termite-control' },
];

export function CleanFriendlyHero({ tenant, content, heroImageUrl }: Props) {
  const bizName = tenant.business_name || tenant.name;
  const phone = tenant.phone ?? '';
  const ctaText = tenant.cta_text || 'Get a Free Quote';

  const c = content as { hero_headline?: string; title?: string; subtitle?: string } | null;
  const headline = c?.hero_headline?.trim() || c?.title?.trim()
    || (bizName ? `${bizName} — Professional Pest Control` : 'Professional Pest Control You Can Trust');
  const heroSubtext = c?.subtitle?.trim() || 'Call for Same-Day Service';

  const bgStyle = heroImageUrl
    ? { backgroundImage: `url(${heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
    : { background: 'linear-gradient(135deg, var(--color-bg-hero, #e0f5ff) 0%, var(--color-bg-hero-end, #bae8ff) 100%)' };

  return (
    <>
      <section className="relative flex items-center justify-center min-h-[65vh]" style={bgStyle}>
        {heroImageUrl && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 0, pointerEvents: 'none' }} />}
        <div className="relative z-10 text-center px-4 py-16">
          {bizName && <p className="text-xl font-semibold tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.9)' }}>{bizName}</p>}
          {phone ? (
            <a href={`tel:${phone.replace(/\D/g, '')}`}
              className="block text-6xl md:text-8xl font-black text-white tracking-tight leading-none mb-3 drop-shadow-lg hover:text-sky-100 transition"
              style={{ textShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
              {formatPhone(phone)}
            </a>
          ) : (
            <h1 className="block text-4xl md:text-6xl font-black text-white tracking-tight leading-none mb-3 drop-shadow-lg"
              style={{ textShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
              {headline}
            </h1>
          )}
          <p className="text-xl mt-2 mb-6" style={{ color: 'rgba(255,255,255,0.8)' }}>{heroSubtext}</p>
          <Link href="/quote" style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}
            className="inline-block font-bold px-8 py-4 rounded-full transition shadow-lg text-lg">{ctaText}</Link>
        </div>
      </section>
      <div className="bg-gray-900">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-700">
          {STRIPS.map((s, i) => (
            <Link key={i} href={s.href} className="flex flex-col items-start py-6 px-8 cursor-pointer hover:bg-gray-800 transition group">
              <span className="text-3xl mb-2" aria-hidden="true">{s.icon}</span>
              <span className="text-white font-bold text-lg transition group-hover:text-[color:var(--color-primary)]">{s.title}</span>
              <span className="text-gray-400 text-sm mt-1">{s.sub}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
