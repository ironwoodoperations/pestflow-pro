import Link from 'next/link';
import type { Tenant } from '../../../../../shared/lib/tenant/types';
import { VitaGlowGlyph, GoldDivider, resolveBookingHref } from './VitaGlowGlyph';

// Loosely-typed home content — every field is optional; copy lives in
// page_content, never hardcoded. Structural labels (category names, button text)
// are navigation chrome and may live in the component.
type HomeContent = {
  eyebrow?: string; hero_headline?: string; title?: string; subtitle?: string;
  intro?: string; cta_headline?: string;
} | null;
export type VgService = { name: string; href: string; blurb?: string; price?: string };
interface Props {
  tenant: Tenant;
  content: HomeContent;
  services: VgService[];
  bookingUrl?: string | null;
}

const display = (size: string): React.CSSProperties => ({
  fontFamily: 'var(--vg-font-display)', fontWeight: 300, fontSize: size,
  letterSpacing: 'var(--vg-tracking-display)', lineHeight: 'var(--vg-line-tight)', margin: 0,
  color: 'var(--vg-ink)',
});
const eyebrow: React.CSSProperties = {
  fontFamily: 'var(--vg-font-body)', fontWeight: 500, fontSize: 12.5,
  letterSpacing: 'var(--vg-tracking-wide)', textTransform: 'uppercase', color: 'var(--vg-gold)',
};
const goldBtn: React.CSSProperties = {
  display: 'inline-block', background: 'var(--vg-gold)', color: 'var(--vg-on-gold)',
  fontFamily: 'var(--vg-font-body)', fontWeight: 500, fontSize: 12.5, letterSpacing: 'var(--vg-tracking-wide)',
  textTransform: 'uppercase', padding: '0.85rem 1.9rem', borderRadius: 'var(--vg-radius)',
  textDecoration: 'none', border: '1px solid var(--vg-gold)',
};
const ghostBtn: React.CSSProperties = {
  ...goldBtn, background: 'transparent', color: 'var(--vg-ink)', border: '1px solid var(--vg-hairline-strong)',
};

function BookCta({ bookingUrl, label = 'Book a Consult', style }: { bookingUrl?: string | null; label?: string; style?: React.CSSProperties }) {
  const { href, external } = resolveBookingHref(bookingUrl);
  const s = { ...goldBtn, ...style };
  return external
    ? <a href={href} target="_blank" rel="noopener noreferrer" style={s}>{label}</a>
    : <Link href={href} style={s}>{label}</Link>;
}

export function VitaGlowHome({ tenant, content, services, bookingUrl }: Props) {
  const bizName = tenant.business_name || tenant.name;
  const heroTitle = content?.hero_headline || content?.title || bizName;
  const heroEyebrow = content?.eyebrow || tenant.tagline || 'Medical Aesthetics & Wellness';
  const heroSub = content?.subtitle || content?.intro || '';
  const ctaHeadline = content?.cta_headline || 'Begin your consultation';

  return (
    <div style={{ background: 'var(--vg-cream)', color: 'var(--vg-text)', fontFamily: 'var(--vg-font-body)' }}>
      <style>{`.vg-card{background:var(--vg-cream-deep);transition:background 260ms ease}.vg-card:hover{background:var(--vg-white)}`}</style>

      {/* 1 — ASYMMETRIC HERO: oversized glyph bleeds left, display type right */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 1.5rem 5rem', display: 'grid', gridTemplateColumns: 'minmax(0,0.9fr) minmax(0,1.1fr)', gap: '2rem', alignItems: 'center' }}>
          <div aria-hidden="true" style={{ position: 'relative', minHeight: 320, marginLeft: 'clamp(-9rem,-9vw,-3rem)' }}>
            <div style={{ opacity: 0.9 }}>
              <VitaGlowGlyph size={440} tone="gold" />
            </div>
          </div>
          <div>
            <p style={eyebrow}>{heroEyebrow}</p>
            <h1 style={{ ...display('clamp(44px,6.5vw,82px)'), marginTop: '1.25rem' }}>{heroTitle}</h1>
            {heroSub && <p style={{ marginTop: '1.5rem', fontFamily: 'var(--vg-font-display)', fontWeight: 300, fontSize: 'clamp(19px,2.2vw,24px)', lineHeight: 'var(--vg-line-body)', color: 'var(--vg-grey)', maxWidth: '44ch' }}>{heroSub}</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', marginTop: '2rem' }}>
              <BookCta bookingUrl={bookingUrl} />
              <Link href="/iv-infusions" style={ghostBtn}>Explore Treatments</Link>
            </div>
          </div>
        </div>
      </section>

      <GoldDivider />

      {/* 2 — SERVICE CARD GRID: gold gridlines, cream cells lighten to white */}
      <section style={{ padding: '4.5rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ ...eyebrow, textAlign: 'center' }}>Our Treatments</p>
          <h2 style={{ ...display('clamp(30px,4vw,48px)'), textAlign: 'center', marginTop: '0.75rem' }}>Curated for how you want to feel</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 1, background: 'var(--vg-hairline-strong)', border: '1px solid var(--vg-hairline-strong)', marginTop: '3rem' }}>
            {services.map((s) => (
              <Link key={s.href} href={s.href} className="vg-card" style={{ display: 'block', padding: '2.25rem 1.75rem', textDecoration: 'none' }}>
                <VitaGlowGlyph size={34} tone="gold" />
                <h3 style={{ ...display('26px'), marginTop: '1.1rem' }}>{s.name}</h3>
                {s.blurb && <p style={{ marginTop: '0.75rem', fontWeight: 300, fontSize: 15, lineHeight: 'var(--vg-line-body)', color: 'var(--vg-grey)' }}>{s.blurb}</p>}
                {s.price && <p style={{ marginTop: '1.1rem', ...eyebrow, color: 'var(--vg-gold)' }}>{s.price}</p>}
                <p style={{ marginTop: '1.25rem', ...eyebrow, color: 'var(--vg-ink)' }}>Explore →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <GoldDivider />

      {/* 3 — EDITORIAL INTRO (content-driven, optional) */}
      {content?.intro && (
        <section style={{ padding: '4.5rem 1.5rem' }}>
          <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--vg-font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(22px,3vw,30px)', lineHeight: 'var(--vg-line-body)', color: 'var(--vg-ink)' }}>{content.intro}</p>
          </div>
        </section>
      )}

      {/* 4 — CTA BAND */}
      <section style={{ background: 'var(--vg-ink)', color: 'var(--vg-cream)', padding: '5rem 1.5rem', textAlign: 'center' }}>
        <VitaGlowGlyph size={40} tone="cream" />
        <h2 style={{ ...display('clamp(32px,4.5vw,54px)'), color: 'var(--vg-cream)', marginTop: '1.25rem' }}>{ctaHeadline}</h2>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
          <BookCta bookingUrl={bookingUrl} />
        </div>
      </section>
    </div>
  );
}
