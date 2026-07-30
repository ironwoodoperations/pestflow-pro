'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Tenant } from '../../../../../shared/lib/tenant/types';
import { formatPhone } from '../../../../../shared/lib/formatPhone';
import { VitaGlowGlyph, resolveBookingHref, VG_A11Y_CSS } from './VitaGlowGlyph';

interface Props { tenant: Tenant; bookingUrl?: string | null }

// Structural nav labels (navigation chrome, not page copy — copy stays in
// page_content). Category routes resolve through the [service] content path.
const LINKS: { label: string; href: string }[] = [
  { label: 'IV Infusions', href: '/iv-infusions' },
  { label: 'Injectables & Aesthetics', href: '/injectables' },
  { label: 'Weight & Wellness', href: '/weight-wellness' },
  { label: 'About', href: '/about' },
];

const eyebrow: React.CSSProperties = {
  fontFamily: 'var(--vg-font-body)', fontWeight: 400, fontSize: 13,
  letterSpacing: 'var(--vg-tracking-wide)', textTransform: 'uppercase', color: 'var(--vg-espresso)',
  textDecoration: 'none',
};

// Single solid espresso "Book a Consult" button (the ONE dark element on cream).
function BookCta({ bookingUrl, block }: { bookingUrl?: string | null; block?: boolean }) {
  const { href, external } = resolveBookingHref(bookingUrl);
  const style: React.CSSProperties = {
    display: block ? 'block' : 'inline-block', textAlign: 'center',
    background: 'var(--vg-espresso)', color: 'var(--vg-on-espresso)', border: '1px solid var(--vg-espresso)',
    fontFamily: 'var(--vg-font-body)', fontWeight: 500, fontSize: 12.5,
    letterSpacing: 'var(--vg-tracking-wide)', textTransform: 'uppercase',
    padding: '0.7rem 1.4rem', borderRadius: 'var(--vg-radius)', textDecoration: 'none',
  };
  return external
    ? <a className="vg-btn vg-focus" href={href} target="_blank" rel="noopener noreferrer" style={style}>Book a Consult</a>
    : <Link className="vg-btn vg-focus" href={href} style={style}>Book a Consult</Link>;
}

export function VitaGlowNavbar({ tenant, bookingUrl }: Props) {
  const [drawer, setDrawer] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const phone = tenant.phone ?? '';
  const tel = phone.replace(/\D/g, '');
  const bizName = tenant.business_name || tenant.name;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Logo renders on the cream nav only (logo asset is designed for light bg).
  const Brand = (
    <Link href="/" aria-label={bizName} className="vg-focus" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
      {tenant.logo_url
        ? <img src={tenant.logo_url} alt={bizName} style={{ height: 64, width: 'auto', display: 'block' }} />
        : <>
            <VitaGlowGlyph size={30} tone="gold" />
            <span style={{ fontFamily: 'var(--vg-font-display)', fontWeight: 400, fontSize: 24, letterSpacing: 'var(--vg-tracking-display)', color: 'var(--vg-espresso)' }}>{bizName}</span>
          </>}
    </Link>
  );

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--vg-cream)', borderBottom: scrolled ? '1px solid var(--vg-hairline)' : '1px solid transparent', transition: 'border-color 200ms ease' }}>
      <style>{VG_A11Y_CSS}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
        {Brand}

        <nav className="hidden md:flex" style={{ alignItems: 'center', gap: '2rem' }}>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="vg-focus" style={eyebrow}>{l.label}</Link>
          ))}
        </nav>

        <div className="hidden md:flex" style={{ alignItems: 'center', gap: '1.25rem' }}>
          {phone && (
            <a href={`tel:${tel}`} className="vg-focus" style={{ ...eyebrow, color: 'var(--vg-taupe)' }}>{formatPhone(phone)}</a>
          )}
          <BookCta bookingUrl={bookingUrl} />
        </div>

        <button className="md:hidden vg-focus" aria-label="Open menu" aria-expanded={drawer} onClick={() => setDrawer(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <span style={{ display: 'block', width: 24, height: 1.5, background: 'var(--vg-espresso)', margin: '5px 0' }} />
          <span style={{ display: 'block', width: 24, height: 1.5, background: 'var(--vg-espresso)', margin: '5px 0' }} />
          <span style={{ display: 'block', width: 24, height: 1.5, background: 'var(--vg-espresso)', margin: '5px 0' }} />
        </button>
      </div>

      {drawer && (
        <>
          <div onClick={() => setDrawer(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(59,42,33,0.35)', zIndex: 60 }} />
          <aside style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(82vw,340px)', background: 'var(--vg-cream)', borderLeft: '1px solid var(--vg-hairline)', zIndex: 61, overflowY: 'auto', padding: '1.5rem' }}>
            <button aria-label="Close menu" onClick={() => setDrawer(false)} className="vg-focus" style={{ background: 'none', border: 'none', fontSize: 26, cursor: 'pointer', color: 'var(--vg-espresso)', fontFamily: 'var(--vg-font-display)' }}>×</button>
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setDrawer(false)} className="vg-focus" style={{ ...eyebrow, display: 'block', padding: '0.85rem 0', borderTop: '1px solid var(--vg-hairline)' }}>{l.label}</Link>
              ))}
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <BookCta bookingUrl={bookingUrl} block />
              {phone && <a href={`tel:${tel}`} className="vg-focus" style={{ ...eyebrow, color: 'var(--vg-taupe)', display: 'block', textAlign: 'center', marginTop: '1rem' }}>{formatPhone(phone)}</a>}
            </div>
          </aside>
        </>
      )}
    </header>
  );
}
