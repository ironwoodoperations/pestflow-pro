import Link from 'next/link';
import type { Tenant } from '../../../../../shared/lib/tenant/types';
import { VitaGlowGlyph, GoldDivider, resolveBookingHref, VG_A11Y_CSS } from './VitaGlowGlyph';

// Content-driven category page — one component reused for IV Infusions,
// Injectables & Aesthetics, and Weight & Wellness. ALL copy (title, intro,
// treatment names, blurbs, prices) comes from page_content; the component
// hardcodes none of it. Blurbs are operator-authored and category-level only —
// no dosing / protocol detail is ever introduced by component defaults.
type Item = { name?: string; blurb?: string; price?: string };
type ServiceContent = {
  eyebrow?: string; title?: string; subtitle?: string; intro?: string;
  items?: Item[]; treatments?: Item[]; cta_headline?: string;
} | null;
interface Props { tenant: Tenant; pageSlug: string; content: ServiceContent; bookingUrl?: string | null }

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
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

function titleCase(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
function BookCta({ bookingUrl, label = 'Book a Consult' }: { bookingUrl?: string | null; label?: string }) {
  const { href, external } = resolveBookingHref(bookingUrl);
  return external
    ? <a className="vg-btn vg-focus" href={href} target="_blank" rel="noopener noreferrer" style={espressoBtn}>{label}</a>
    : <Link className="vg-btn vg-focus" href={href} style={espressoBtn}>{label}</Link>;
}

export function VitaGlowServicesPage({ pageSlug, content, bookingUrl }: Props) {
  const heroTitle = content?.title || titleCase(pageSlug);
  const heroEyebrow = content?.eyebrow || 'Treatments';
  const heroSub = content?.subtitle || '';
  const items = (content?.items ?? content?.treatments ?? []).filter((i) => i?.name);
  const ctaHeadline = content?.cta_headline || 'Ready to begin?';

  return (
    <div style={{ background: 'var(--vg-cream)', color: 'var(--vg-text)', fontFamily: 'var(--vg-font-body)' }}>
      <style>{VG_A11Y_CSS + '.vg-card{background:var(--vg-cream-2);transition:background 260ms ease}.vg-card:hover{background:var(--vg-white)}'}</style>

      {/* HERO */}
      <section style={{ padding: '4.5rem 1.5rem 3.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}><VitaGlowGlyph size={44} tone="gold" /></div>
        <p style={{ ...eyebrow, marginTop: '1.25rem' }}>{heroEyebrow}</p>
        <h1 style={{ ...display('clamp(40px,6vw,72px)'), marginTop: '0.9rem' }}>{heroTitle}</h1>
        {heroSub && <p style={{ marginTop: '1.5rem', fontFamily: 'var(--vg-font-display)', fontWeight: 300, fontSize: 'clamp(19px,2.2vw,24px)', lineHeight: 'var(--vg-line-body)', color: 'var(--vg-taupe)', maxWidth: '52ch', marginInline: 'auto' }}>{heroSub}</p>}
      </section>

      <GoldDivider />

      {/* INTRO (content-driven, optional) */}
      {content?.intro && (
        <section style={{ padding: '4rem 1.5rem' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--vg-font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(21px,2.8vw,28px)', lineHeight: 'var(--vg-line-body)', color: 'var(--vg-espresso)' }}>{content.intro}</p>
          </div>
        </section>
      )}

      {/* TREATMENT LIST — cream-2 cells, gold hairlines, Roman numerals */}
      {items.length > 0 && (
        <section style={{ background: 'var(--vg-cream-2)', padding: '4rem 1.5rem' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 1, background: 'var(--vg-hairline-strong)' }}>
            {items.map((it, i) => (
              <div key={i} className="vg-card" style={{ padding: '2.5rem 1.75rem' }}>
                <span style={{ fontFamily: 'var(--vg-font-display)', fontWeight: 400, fontStyle: 'italic', fontSize: 28, color: 'var(--vg-gold)' }}>{ROMAN[i] ?? i + 1}</span>
                <h3 style={{ ...display('25px'), marginTop: '0.8rem' }}>{it.name}</h3>
                {it.blurb && <p style={{ marginTop: '0.75rem', fontWeight: 300, fontSize: 15, lineHeight: 'var(--vg-line-body)', color: 'var(--vg-taupe)' }}>{it.blurb}</p>}
                {it.price && <p style={{ marginTop: '1.1rem', ...eyebrow, color: 'var(--vg-gold)' }}>{it.price}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <GoldDivider />

      {/* CTA (cream, espresso ink + button — NO dark panel) */}
      <section style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ ...display('clamp(30px,4.5vw,50px)') }}>{ctaHeadline}</h2>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
          <BookCta bookingUrl={bookingUrl} />
        </div>
      </section>
    </div>
  );
}
