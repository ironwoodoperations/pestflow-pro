import { ContactForm } from '../../_components/forms/ContactForm';
import { VitaGlowGlyph, GoldDivider, resolveBookingHref } from './VitaGlowGlyph';

// Book-a-Consult page — editorial chrome around the SHARED ContactForm (same
// wrapper pattern as DangComicContactPage). The booking CTA is config-driven
// (brief §6): a Square URL from settings.integrations renders a primary "Book
// Online" button; shipping blank, this route IS the fallback, so it simply
// presents the consult form. Copy comes from page_content via the route.
interface Props {
  heroTitle: string;
  heroSub: string;
  tenantId: string;
  bizName: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  facebook?: string;
  instagram?: string;
  google?: string;
  ownerSmsNumber?: string;
  shellTemplate?: string;
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

export function VitaGlowContactPage(props: Props) {
  const { heroTitle, heroSub, bookingUrl, ...form } = props;
  const { href: bookHref, external: bookExternal } = resolveBookingHref(bookingUrl);

  return (
    <div style={{ background: 'var(--vg-cream)', color: 'var(--vg-text)', fontFamily: 'var(--vg-font-body)' }}>
      {/* HERO */}
      <section style={{ padding: '4.5rem 1.5rem 3rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}><VitaGlowGlyph size={44} tone="gold" /></div>
        <p style={{ ...eyebrow, marginTop: '1.25rem' }}>Book a Consult</p>
        <h1 style={{ ...display('clamp(40px,6vw,72px)'), marginTop: '0.9rem' }}>{heroTitle || 'Book a Consult'}</h1>
        {heroSub && <p style={{ marginTop: '1.5rem', fontFamily: 'var(--vg-font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(19px,2.2vw,24px)', lineHeight: 'var(--vg-line-body)', color: 'var(--vg-grey)', maxWidth: '52ch', marginInline: 'auto' }}>{heroSub}</p>}

        {/* Config-driven booking CTA — only when a Square URL is set */}
        {bookExternal && (
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
            <a href={bookHref} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: 'var(--vg-gold)', color: 'var(--vg-on-gold)', fontFamily: 'var(--vg-font-body)', fontWeight: 500, fontSize: 12.5, letterSpacing: 'var(--vg-tracking-wide)', textTransform: 'uppercase', padding: '0.95rem 2.2rem', borderRadius: 'var(--vg-radius)', textDecoration: 'none', border: '1px solid var(--vg-gold)' }}>
              Book Online
            </a>
          </div>
        )}
      </section>

      <GoldDivider />

      {/* CONSULT FORM */}
      <section style={{ padding: '3.5rem 1.5rem 5rem' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', background: 'var(--vg-white)', border: '1px solid var(--vg-hairline-strong)', borderRadius: 'var(--vg-radius)', padding: '2rem' }}>
          <ContactForm
            tenantId={form.tenantId}
            bizName={form.bizName}
            phone={form.phone}
            email={form.email}
            address={form.address}
            hours={form.hours}
            facebook={form.facebook ?? ''}
            instagram={form.instagram ?? ''}
            google={form.google ?? ''}
            ownerSmsNumber={form.ownerSmsNumber ?? ''}
            shellTemplate={form.shellTemplate}
            hideContactSidebar
          />
        </div>
      </section>
    </div>
  );
}
