import Link from 'next/link';
import type { Tenant } from '../../../../../shared/lib/tenant/types';
import { formatPhone } from '../../../../../shared/lib/formatPhone';
import { getShellImage } from '../../../../../src/shells/_shared/getShellImage';
import { HeroIllustration } from './HeroIllustration';

interface Props {
  tenant: Tenant;
  content: Record<string, unknown> | null;
  heroMedia?: Record<string, unknown> | null;
  heroImageUrl?: string | null;
}

const SAFETY_CHIPS = [
  { label: 'Pet-safe' },
  { label: 'Kid-friendly' },
  { label: 'Licensed & insured' },
];

export function CleanFriendlyHero({ tenant, content, heroMedia, heroImageUrl }: Props) {
  const phone = tenant.phone ?? '';
  const c = content as { hero_headline?: string; hero_eyebrow?: string; hero_subhead?: string; title?: string; subtitle?: string } | null;

  const eyebrow = c?.hero_eyebrow?.trim() || 'for families who care about what they bring home';
  const headline = c?.hero_headline?.trim() || c?.title?.trim()
    || 'A quieter home. A safer yard. Pest control you can trust.';
  const subhead = c?.hero_subhead?.trim() || c?.subtitle?.trim()
    || tenant.tagline
    || 'Licensed technicians, transparent pricing, and treatments safe for your whole family.';

  const resolvedImage = getShellImage({ content, heroMedia, heroImageUrl });

  const GRID: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '2.5rem',
    alignItems: 'center',
  };

  return (
    <section style={{ backgroundColor: 'var(--cf-surface)', borderBottom: '1px solid var(--cf-divider)', padding: '4rem 1rem 3rem' }}>
      <style>{`@media(min-width:768px){.cf-hero-grid{grid-template-columns:58% 42% !important}}.cf-hero-right{order:-1}@media(min-width:768px){.cf-hero-right{order:1}}`}</style>
      <div className="max-w-6xl mx-auto cf-hero-grid" style={GRID}>

        {/* Left — text */}
        <div>
          <p style={{ fontFamily: "Georgia,'Source Serif Pro',serif", fontStyle: 'italic', fontSize: 14, color: 'var(--cf-ink-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
            {eyebrow}
          </p>
          <h1 style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 'clamp(28px,4.5vw,52px)', lineHeight: 1.2, color: 'var(--cf-ink)', marginBottom: '1.25rem' }}>
            {headline}
          </h1>
          <p style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 400, fontSize: 18, lineHeight: 1.65, color: 'var(--cf-ink-secondary)', marginBottom: '2rem', maxWidth: '44ch' }}>
            {subhead}
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Link href="/quote" style={{ display: 'inline-block', backgroundColor: 'var(--cf-ink)', color: 'var(--cf-surface)', fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 16, padding: '0.8rem 1.75rem', borderRadius: 28, textDecoration: 'none' }}>
              Get your free quote
            </Link>
            {phone && (
              <a href={`tel:${phone.replace(/\D/g, '')}`} style={{ display: 'inline-block', border: '1px solid var(--cf-ink)', color: 'var(--cf-ink)', fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 16, padding: '0.8rem 1.75rem', borderRadius: 28, textDecoration: 'none', backgroundColor: 'transparent' }}>
                {formatPhone(phone)}
              </a>
            )}
          </div>

          {/* Safety chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {SAFETY_CHIPS.map((chip) => (
              <span key={chip.label} style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 13, fontWeight: 500, color: 'var(--cf-mint)', border: '1px solid var(--cf-mint)', borderRadius: 28, padding: '4px 12px', backgroundColor: 'var(--cf-bg-mint)' }}>
                ✓ {chip.label}
              </span>
            ))}
          </div>
        </div>

        {/* Right — illustration or hero image */}
        <div className="cf-hero-right">
          {resolvedImage ? (
            <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--cf-divider)', boxShadow: '0 2px 12px rgba(31,58,77,0.06)' }}>
              <img src={resolvedImage} alt={tenant.business_name || tenant.name} style={{ width: '100%', display: 'block', aspectRatio: '4/3', objectFit: 'cover' }} />
            </div>
          ) : (
            <HeroIllustration />
          )}
        </div>
      </div>
    </section>
  );
}
