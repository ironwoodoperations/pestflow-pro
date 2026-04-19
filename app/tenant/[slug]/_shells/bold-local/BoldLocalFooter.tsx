import Link from 'next/link';
import type { Tenant } from '../../../../../shared/lib/tenant/types';
import { formatPhone } from '../../../../../shared/lib/formatPhone';

const SERVICE_LINKS = [
  { label: 'Mosquito Control', href: '/mosquito-control' },
  { label: 'Ant Control', href: '/ant-control' },
  { label: 'Roach Control', href: '/roach-control' },
  { label: 'Termite Control', href: '/termite-control' },
  { label: 'Rodent Control', href: '/rodent-control' },
  { label: 'Pest Control', href: '/pest-control' },
];

const FbIcon = () => <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
const IgIcon = () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>;

interface Social { facebook?: string; instagram?: string; google?: string }
interface Props { tenant: Tenant; social?: Social }

const COL_HEAD = { fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 10, fontWeight: 600, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--bl-text-muted)', marginBottom: '0.75rem', display: 'block' } as React.CSSProperties;
const FOOT_LINK = { fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 13, color: 'var(--bl-text-secondary)', textDecoration: 'none', display: 'block', marginBottom: '0.4rem', lineHeight: 1.5 } as React.CSSProperties;

export function BoldLocalFooter({ tenant, social = {} }: Props) {
  const name = tenant.business_name || tenant.name;
  const phone = tenant.phone ?? '';
  const year = new Date().getFullYear();

  return (
    <footer style={{ backgroundColor: 'var(--bl-surface-2)', borderTop: '1px solid var(--bl-border)' }}>
      <div className="max-w-7xl mx-auto px-4 py-12" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: '2rem' }}>

        <div>
          {tenant.logo_url
            ? <img src={tenant.logo_url} alt={name} style={{ height: 36, objectFit: 'contain', marginBottom: 12 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            : <p style={{ fontFamily: "var(--font-barlow,'Barlow Condensed','Oswald',sans-serif)", fontWeight: 700, fontSize: 18, color: 'var(--bl-text)', marginBottom: 12 }}>{name}</p>
          }
          {tenant.tagline && <p style={FOOT_LINK}>{tenant.tagline}</p>}
          {tenant.license_number && <p style={{ ...FOOT_LINK, fontSize: 12 }}>Lic. #{tenant.license_number}</p>}
          {(social?.facebook || social?.instagram) && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
              {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" style={{ color: 'var(--bl-accent)' }}><FbIcon /></a>}
              {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ color: 'var(--bl-accent)' }}><IgIcon /></a>}
            </div>
          )}
        </div>

        <div>
          <span style={COL_HEAD}>Services</span>
          {SERVICE_LINKS.map((l) => <Link key={l.href} href={l.href} style={FOOT_LINK}>{l.label}</Link>)}
        </div>

        <div>
          <span style={COL_HEAD}>Company</span>
          {[{ label: 'About Us', href: '/about' }, { label: 'Service Area', href: '/service-area' }, { label: 'Blog', href: '/blog' }, { label: 'Reviews', href: '/reviews' }, { label: 'Contact', href: '/contact' }].map((l) => (
            <Link key={l.href} href={l.href} style={FOOT_LINK}>{l.label}</Link>
          ))}
        </div>

        <div>
          <span style={COL_HEAD}>Contact</span>
          {phone && <a href={`tel:${phone.replace(/\D/g, '')}`} style={{ ...FOOT_LINK, color: 'var(--bl-accent)', fontWeight: 600 }}>{formatPhone(phone)}</a>}
          {tenant.email && <a href={`mailto:${tenant.email}`} style={FOOT_LINK}>{tenant.email}</a>}
          {tenant.address && <p style={FOOT_LINK}>{tenant.address}</p>}
          {tenant.hours && <p style={{ ...FOOT_LINK, fontSize: 12 }}>{tenant.hours}</p>}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--bl-border)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <p style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 12, color: 'var(--bl-text-muted)' }}>
          &copy; {year} {name}. All rights reserved.
        </p>
        <a href="https://pestflowpro.com" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 11, color: 'var(--bl-accent)', textDecoration: 'none', fontWeight: 500 }}>
          Powered by PestFlow Pro
        </a>
      </div>
    </footer>
  );
}
