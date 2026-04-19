import Link from 'next/link';
import type { Tenant } from '../../../../../shared/lib/tenant/types';
import { formatPhone } from '../../../../../shared/lib/formatPhone';
import { PestIcon } from '../../../../../src/shells/_shared/PestIcon';
import { VideoPosterPlayer } from '../../../../../src/shells/_shared/VideoPosterPlayer';

interface HeroMedia {
  youtube_id?: string;
  video_url?: string;
  image_url?: string;
  master_hero_image_url?: string;
  thumbnail_url?: string;
}

interface Props {
  tenant: Tenant;
  content: Record<string, unknown> | null;
  heroMedia?: Record<string, unknown> | null;
  heroImageUrl?: string | null;
}

const GRID_STYLE = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '2.5rem',
  alignItems: 'center',
} as React.CSSProperties;

const H1_STYLE = {
  fontFamily: "var(--font-barlow,'Barlow Condensed','Oswald',sans-serif)",
  fontSize: 'clamp(32px,5vw,60px)',
  fontWeight: 700,
  lineHeight: 1.08,
  letterSpacing: '-0.01em',
  color: 'var(--bl-text)',
  marginBottom: '1rem',
} as React.CSSProperties;

export function BoldLocalHero({ tenant, content, heroMedia, heroImageUrl }: Props) {
  const bizName = tenant.business_name || tenant.name;
  const phone = tenant.phone ?? '';
  const foundedYear = tenant.founded_year;

  const c = content as { hero_headline?: string; title?: string; subtitle?: string } | null;
  const headline = c?.hero_headline?.trim() || c?.title?.trim()
    || `${bizName}. Local pest control that actually works.`;
  const subtitle = c?.subtitle?.trim()
    || tenant.tagline
    || 'Licensed technicians. Transparent pricing. Real results.';

  const hm = heroMedia as HeroMedia | null;
  const youtubeId = hm?.youtube_id?.trim() || '';
  const videoUrl = hm?.video_url?.trim() || '';
  const posterUrl = hm?.thumbnail_url || hm?.image_url || heroImageUrl || '';
  const hasVideo = !!(youtubeId || videoUrl);

  return (
    <section style={{ backgroundColor: 'var(--bl-surface)', borderBottom: '1px solid var(--bl-border)' }}>
      <style>{`@media(min-width:768px){.bl-hero-grid{grid-template-columns:55% 45% !important}}.bl-right-col{order:-1}.@media(min-width:768px){.bl-right-col{order:1}}`}</style>
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-20 bl-hero-grid" style={GRID_STYLE}>

        {/* Left — text */}
        <div>
          {foundedYear && (
            <p style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bl-accent)', marginBottom: '0.75rem', borderLeft: '3px solid var(--bl-accent)', paddingLeft: '0.5rem' }}>
              Since {foundedYear}
            </p>
          )}
          <h1 style={H1_STYLE}>{headline}</h1>
          <p style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 18, fontWeight: 400, color: 'var(--bl-text-secondary)', lineHeight: 1.55, marginBottom: '2rem', maxWidth: '42ch' }}>
            {subtitle}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <Link href="/quote" style={{ display: 'inline-block', backgroundColor: 'var(--bl-accent)', color: '#0F1216', fontFamily: "var(--font-barlow,'Barlow Condensed','Oswald',sans-serif)", fontWeight: 700, fontSize: 16, letterSpacing: '0.02em', padding: '0.8rem 1.75rem', borderRadius: 0, textDecoration: 'none' }}>
              Get a free quote
            </Link>
            {phone && (
              <a href={`tel:${phone.replace(/\D/g, '')}`} style={{ display: 'inline-block', border: '2px solid var(--bl-accent)', color: 'var(--bl-text)', fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 16, padding: '0.8rem 1.75rem', borderRadius: 0, textDecoration: 'none' }}>
                {formatPhone(phone)}
              </a>
            )}
          </div>
        </div>

        {/* Right — visual anchor (first on mobile via CSS order) */}
        <div className="bl-right-col" style={{ backgroundColor: 'var(--bl-surface-2)', border: '2px solid var(--bl-accent)', overflow: 'hidden', minHeight: 240 }}>
          {hasVideo && posterUrl ? (
            <VideoPosterPlayer posterUrl={posterUrl} youtubeId={youtubeId || undefined} videoUrl={videoUrl || undefined} caption="Watch: meet the crew" playButtonColor="#F5A623" aspectRatio="16 / 9" />
          ) : heroImageUrl ? (
            <img src={heroImageUrl} alt={bizName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', aspectRatio: '16/9' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 240, color: 'var(--bl-accent)', opacity: 0.5 }}>
              <PestIcon pest="pest-control" size={80} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
