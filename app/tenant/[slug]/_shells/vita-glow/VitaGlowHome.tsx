import Link from 'next/link';
import type { Tenant } from '../../../../../shared/lib/tenant/types';
import { VitaGlowGlyph, GoldDivider, resolveBookingHref, VG_A11Y_CSS } from './VitaGlowGlyph';

// Loosely-typed home content — every field optional; copy lives in page_content.
type HomeContent = {
  eyebrow?: string; hero_headline?: string; title?: string; subtitle?: string;
  intro?: string; cta_headline?: string;
} | null;
export type VgService = { name: string; href: string; blurb?: string; price?: string };
interface Props { tenant: Tenant; content: HomeContent; services: VgService[]; bookingUrl?: string | null }

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const display = (size: string): React.CSSProperties => ({
  fontFamily: 'var(--vg-font-display)', fontWeight: 300, fontSize: size,
  letterSpacing: 'var(--vg-tracking-display)', lineHeight: 'var(--vg-line-tight)', margin: 0, color: 'var(--vg-espresso)',
});
const eyebrow: React.CSSProperties = {
  fontFamily: 'var(--vg-font-body)', fontWeight: 500, fontSize: 12.5,
  letterSpacing: 'var(--vg-tracking-wide)', textTransform: 'uppercase', color: 'var(--vg-gold)',
};
const espressoBtn: React.CSSProperties = {
  display: 'inline-block', background: 'var(--vg-espresso)', color: 'var(--vg-on-espresso)',
  fontFamily: 'var(--vg-font-body)', fontWeight: 500, fontSize: 12.5, letterSpacing: 'var(--vg-tracking-wide)',
  textTransform: 'uppercase', padding: '0.9rem 2rem', borderRadius: 'var(--vg-radius)', textDecoration: 'none',
  border: '1px solid var(--vg-espresso)',
};
const ghostBtn: React.CSSProperties = {
  ...espressoBtn, background: 'transparent', color: 'var(--vg-espresso)', border: '1px solid var(--vg-taupe)',
};
const HERO_CSS =
  '.vg-hero{display:grid;grid-template-columns:1.05fr 0.95fr;align-items:stretch;min-height:520px}' +
  '.vg-hero-right{position:relative;border-left:1px solid var(--vg-gold);background:linear-gradient(150deg,#EFE7D8,#E7DCC8 60%,#DFD2BA)}' +
  '.vg-seam{position:absolute;left:0;top:50%;transform:translate(-50%,-50%) rotate(-90deg);background:var(--vg-cream);padding:0 .75rem;white-space:nowrap}' +
  '.vg-card{background:var(--vg-cream-2);transition:background 260ms ease}.vg-card:hover{background:var(--vg-white)}' +
  '@media (max-width:768px){.vg-hero{grid-template-columns:1fr}.vg-hero-right{border-left:none;min-height:300px}.vg-seam{display:none}}';

function BookCta({ bookingUrl, label = 'Book a Consult', style }: { bookingUrl?: string | null; label?: string; style?: React.CSSProperties }) {
  const { href, external } = resolveBookingHref(bookingUrl);
  const s = { ...espressoBtn, ...style };
  return external
    ? <a className="vg-btn vg-focus" href={href} target="_blank" rel="noopener noreferrer" style={s}>{label}</a>
    : <Link className="vg-btn vg-focus" href={href} style={s}>{label}</Link>;
}

export function VitaGlowHome({ tenant, content, services, bookingUrl }: Props) {
  const bizName = tenant.business_name || tenant.name;
  const heroTitle = content?.hero_headline || content?.title || bizName;
  const heroEyebrow = content?.eyebrow || tenant.tagline || 'Medical Aesthetics & Wellness';
  const heroSub = content?.subtitle || content?.intro || '';
  const ctaHeadline = content?.cta_headline || 'Begin your consultation';

  return (
    <div style={{ background: 'var(--vg-cream)', color: 'var(--vg-text)', fontFamily: 'var(--vg-font-body)' }}>
      <style>{VG_A11Y_CSS + HERO_CSS}</style>

      {/* 1 — SPLIT HERO: cream-left type, warm-cream-gradient right panel, gold seam */}
      <section>
        <div className="vg-hero" style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ padding: 'clamp(3rem,6vw,5.5rem) clamp(1.5rem,4vw,4rem)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={eyebrow}>{heroEyebrow}</p>
            <h1 style={{ ...display('clamp(46px,6.5vw,88px)'), marginTop: '1.25rem' }}>{heroTitle}</h1>
            {heroSub && <p style={{ marginTop: '1.5rem', fontFamily: 'var(--vg-font-display)', fontWeight: 300, fontSize: 'clamp(19px,2.2vw,25px)', lineHeight: 'var(--vg-line-body)', color: 'var(--vg-taupe)', maxWidth: '44ch' }}>{heroSub}</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', marginTop: '2rem' }}>
              <BookCta bookingUrl={bookingUrl} />
              <Link href="/iv-infusions" className="vg-focus" style={ghostBtn}>Explore Treatments</Link>
            </div>
          </div>
          <div className="vg-hero-right">
            <span className="vg-seam" style={{ ...eyebrow, color: 'var(--vg-taupe)', fontSize: 11 }}>Hydration + Aesthetics</span>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              {tenant.logo_url
                ? <img src={tenant.logo_url} alt={bizName} style={{ width: 'min(900px,92%)', maxWidth: '92%', height: 'auto', display: 'block' }} />
                : <VitaGlowGlyph size={260} tone="gold" />}
            </div>
          </div>
        </div>
      </section>

      <GoldDivider />

      {/* 2 — TREATMENTS BAND: cream-2, gold hairlines, serif Roman numerals */}
      <section style={{ background: 'var(--vg-cream-2)', padding: '4.5rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ ...eyebrow, textAlign: 'center' }}>Our Treatments</p>
          <h2 style={{ ...display('clamp(30px,4vw,48px)'), textAlign: 'center', marginTop: '0.75rem' }}>Curated for how you want to feel</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 1, background: 'var(--vg-hairline-strong)', marginTop: '3rem' }}>
            {services.map((s, i) => (
              <Link key={s.href} href={s.href} className="vg-card vg-focus" style={{ display: 'block', padding: '2.5rem 1.75rem', textDecoration: 'none' }}>
                <span style={{ fontFamily: 'var(--vg-font-display)', fontWeight: 400, fontStyle: 'italic', fontSize: 30, color: 'var(--vg-gold)' }}>{ROMAN[i] ?? i + 1}</span>
                <h3 style={{ ...display('26px'), marginTop: '0.9rem' }}>{s.name}</h3>
                {s.blurb && <p style={{ marginTop: '0.75rem', fontWeight: 300, fontSize: 15, lineHeight: 'var(--vg-line-body)', color: 'var(--vg-taupe)' }}>{s.blurb}</p>}
                {s.price && <p style={{ marginTop: '1.1rem', ...eyebrow, color: 'var(--vg-gold)' }}>{s.price}</p>}
                <p style={{ marginTop: '1.25rem', ...eyebrow, color: 'var(--vg-espresso)' }}>Explore →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3 — EDITORIAL INTRO (content-driven, optional) */}
      {content?.intro && (
        <>
          <GoldDivider />
          <section style={{ padding: '4.5rem 1.5rem' }}>
            <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--vg-font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(22px,3vw,30px)', lineHeight: 'var(--vg-line-body)', color: 'var(--vg-espresso)' }}>{content.intro}</p>
            </div>
          </section>
        </>
      )}

      {/* 4 — CTA (cream, espresso ink + button — NO dark panel) */}
      <section style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <VitaGlowGlyph size={38} tone="gold" />
        <h2 style={{ ...display('clamp(32px,4.5vw,54px)'), marginTop: '1.25rem' }}>{ctaHeadline}</h2>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
          <BookCta bookingUrl={bookingUrl} />
        </div>
      </section>
    </div>
  );
}
