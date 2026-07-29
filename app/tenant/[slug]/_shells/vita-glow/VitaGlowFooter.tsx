import Link from 'next/link';
import type { Tenant } from '../../../../../shared/lib/tenant/types';
import { formatPhone } from '../../../../../shared/lib/formatPhone';
import { VitaGlowGlyph, resolveBookingHref } from './VitaGlowGlyph';

interface Social { facebook?: string; instagram?: string; google?: string; youtube?: string }
interface Props { tenant: Tenant; social?: Social; bookingUrl?: string | null }

// Structural nav (navigation chrome, not page copy).
const SERVICES = [
  { label: 'IV Infusions', href: '/iv-infusions' },
  { label: 'Injectables & Aesthetics', href: '/injectables' },
  { label: 'Weight & Wellness', href: '/weight-wellness' },
];
const EXPLORE = [
  { label: 'About', href: '/about' },
  { label: 'Book a Consult', href: '/contact' },
];
const LEGAL = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Accessibility', href: '/accessibility' },
];

const colTitle: React.CSSProperties = {
  fontFamily: 'var(--vg-font-body)', fontWeight: 500, fontSize: 12,
  letterSpacing: 'var(--vg-tracking-wide)', textTransform: 'uppercase',
  color: 'var(--vg-gold)', marginBottom: '1rem',
};
const colLink: React.CSSProperties = {
  display: 'block', padding: '0.35rem 0', textDecoration: 'none',
  fontFamily: 'var(--vg-font-body)', fontWeight: 300, fontSize: 14, color: 'var(--vg-espresso)',
};

export function VitaGlowFooter({ tenant, social = {}, bookingUrl }: Props) {
  const bizName = tenant.business_name || tenant.name;
  const phone = tenant.phone ?? '';
  const tel = phone.replace(/\D/g, '');
  const { href: bookHref, external: bookExternal } = resolveBookingHref(bookingUrl);

  // Footer is CREAM (light) — the logo asset (light-bg design) renders safely here.
  return (
    <footer style={{ background: 'var(--vg-cream-2)', color: 'var(--vg-espresso)', borderTop: '1px solid var(--vg-hairline-strong)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 1.5rem 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '2.5rem' }}>
        <div style={{ minWidth: 200 }}>
          {tenant.logo_url
            ? <img src={tenant.logo_url} alt={bizName} style={{ height: 52, width: 'auto', display: 'block' }} />
            : <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <VitaGlowGlyph size={30} tone="gold" />
                <span style={{ fontFamily: 'var(--vg-font-display)', fontWeight: 400, fontSize: 24, letterSpacing: 'var(--vg-tracking-display)', color: 'var(--vg-espresso)' }}>{bizName}</span>
              </div>}
          {tenant.tagline && (
            <p style={{ marginTop: '1rem', fontFamily: 'var(--vg-font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: 18, lineHeight: 'var(--vg-line-body)', color: 'var(--vg-taupe)', maxWidth: 260 }}>{tenant.tagline}</p>
          )}
          {phone && <a href={`tel:${tel}`} style={{ ...colLink, marginTop: '1rem', color: 'var(--vg-gold)' }}>{formatPhone(phone)}</a>}
          {tenant.address && <p style={{ ...colLink, color: 'var(--vg-taupe)' }}>{tenant.address}</p>}
        </div>

        <div>
          <p style={colTitle}>Treatments</p>
          {SERVICES.map((s) => <Link key={s.href} href={s.href} style={colLink}>{s.label}</Link>)}
        </div>
        <div>
          <p style={colTitle}>Explore</p>
          {EXPLORE.map((e) => <Link key={e.href} href={e.href} style={colLink}>{e.label}</Link>)}
        </div>
        <div>
          <p style={colTitle}>Book</p>
          {bookExternal
            ? <a href={bookHref} target="_blank" rel="noopener noreferrer" style={colLink}>Schedule Online</a>
            : <Link href={bookHref} style={colLink}>Schedule a Consult</Link>}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" style={{ ...colLink, padding: 0 }}>Instagram</a>}
            {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" style={{ ...colLink, padding: 0 }}>Facebook</a>}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--vg-hairline)', maxWidth: 1200, margin: '0 auto', padding: '1.25rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1.5rem' }}>
          {LEGAL.map((l) => <Link key={l.href} href={l.href} style={{ ...colLink, padding: 0, fontSize: 12.5, color: 'var(--vg-taupe)' }}>{l.label}</Link>)}
        </div>
        <p style={{ fontFamily: 'var(--vg-font-body)', fontWeight: 300, fontSize: 12.5, color: 'var(--vg-taupe)' }}>© 2026 {bizName}</p>
      </div>

      <div style={{ textAlign: 'center', padding: '1rem', borderTop: '1px solid var(--vg-hairline)' }}>
        <a href="https://pestflowpro.ai" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--vg-gold)', fontWeight: 500, fontSize: 12.5, letterSpacing: '0.08em', textDecoration: 'none', fontFamily: 'var(--vg-font-body)' }}>
          Powered by PestFlow Pro
        </a>
      </div>
    </footer>
  );
}
