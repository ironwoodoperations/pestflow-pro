import Link from 'next/link';
import type { Tenant } from '../../../../../shared/lib/tenant/types';
import { VitaGlowGlyph, GoldDivider, resolveBookingHref } from './VitaGlowGlyph';

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
interface Props {
  tenant: Tenant;
  pageSlug: string;
  content: ServiceContent;
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

function titleCase(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function BookCta({ bookingUrl, label = 'Book a Consult' }: { bookingUrl?: string | null; label?: string }) {
  const { href, external } = resolveBookingHref(bookingUrl);
  return external
    ? <a href={href} target="_blank" rel="noopener noreferrer" style={goldBtn}>{label}</a>
    : <Link href={href} style={goldBtn}>{label}</Link>;
}

export function VitaGlowServicesPage({ pageSlug, content, bookingUrl }: Props) {
  const heroTitle = content?.title || titleCase(pageSlug);
  const heroEyebrow = content?.eyebrow || 'Treatments';
  const heroSub = content?.subtitle || '';
  const items = (content?.items ?? content?.treatments ?? []).filter((i) => i?.name);
  const ctaHeadline = content?.cta_headline || 'Ready to begin?';

  return (
    <div style={{ background: 'var(--vg-cream)', color: 'var(--vg-text)', fontFamily: 'var(--vg-font-body)' }}>
      <style>{`.vg-card{background:var(--vg-cream-deep);transition:background 260ms ease}.vg-card:hover{background:var(--vg-white)}`}</style>

      {/* HERO */}
      <section style={{ padding: '4.5rem 1.5rem 3.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}><VitaGlowGlyph size={44} tone="gold" /></div>
        <p style={{ ...eyebrow, marginTop: '1.25rem' }}>{heroEyebrow}</p>
        <h1 style={{ ...display('clamp(40px,6vw,72px)'), marginTop: '0.9rem' }}>{heroTitle}</h1>
        {heroSub && <p style={{ marginTop: '1.5rem', fontFamily: 'var(--vg-font-display)', fontWeight: 300, fontSize: 'clamp(19px,2.2vw,24px)', lineHeight: 'var(--vg-line-body)', color: 'var(--vg-grey)', maxWidth: '52ch', marginInline: 'auto' }}>{heroSub}</p>}
      </section>

      <GoldDivider />

      {/* INTRO (content-driven, optional) */}
      {content?.intro && (
        <section style={{ padding: '4rem 1.5rem' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--vg-font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(21px,2.8vw,28px)', lineHeight: 'var(--vg-line-body)', color: 'var(--vg-ink)' }}>{content.intro}</p>
          </div>
        </section>
      )}

      {/* TREATMENT LIST — gold gridlines, cream → white on hover */}
      {items.length > 0 && (
        <section style={{ padding: '1rem 1.5rem 4.5rem' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 1, background: 'var(--vg-hairline-strong)', border: '1px solid var(--vg-hairline-strong)' }}>
            {items.map((it, i) => (
              <div key={i} className="vg-card" style={{ padding: '2.25rem 1.75rem' }}>
                <VitaGlowGlyph size={30} tone="gold" />
                <h3 style={{ ...display('25px'), marginTop: '1rem' }}>{it.name}</h3>
                {it.blurb && <p style={{ marginTop: '0.75rem', fontWeight: 300, fontSize: 15, lineHeight: 'var(--vg-line-body)', color: 'var(--vg-grey)' }}>{it.blurb}</p>}
                {it.price && <p style={{ marginTop: '1.1rem', ...eyebrow, color: 'var(--vg-gold)' }}>{it.price}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA BAND */}
      <section style={{ background: 'var(--vg-ink)', color: 'var(--vg-cream)', padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ ...display('clamp(30px,4.5vw,50px)'), color: 'var(--vg-cream)' }}>{ctaHeadline}</h2>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
          <BookCta bookingUrl={bookingUrl} />
        </div>
      </section>
    </div>
  );
}
