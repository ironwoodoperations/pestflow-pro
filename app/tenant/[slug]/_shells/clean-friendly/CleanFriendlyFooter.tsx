'use client';

import Link from 'next/link';
import type { Tenant } from '../../../../../shared/lib/tenant/types';
import { formatPhone } from '../../../../../shared/lib/formatPhone';

const SERVICE_LINKS = [
  { label: 'Mosquito control', href: '/mosquito-control' },
  { label: 'Ant control', href: '/ant-control' },
  { label: 'Roach control', href: '/roach-control' },
  { label: 'Termite control', href: '/termite-control' },
  { label: 'Rodent control', href: '/rodent-control' },
  { label: 'Pest control', href: '/pest-control' },
];

const COMPANY_LINKS = [
  { label: 'About us', href: '/about' },
  { label: 'Our process', href: '/#how-it-works' },
  { label: 'Service area', href: '/service-area' },
  { label: 'Blog', href: '/blog' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
];

const FbIcon = () => <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
const IgIcon = () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>;

interface Social { facebook?: string; instagram?: string; google?: string }
interface Props { tenant: Tenant; social?: Social }

const COL_HEAD: React.CSSProperties = { fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 600, fontSize: 13, color: 'var(--cf-ink)', marginBottom: '0.75rem', display: 'block' };
const FOOT_LINK: React.CSSProperties = { fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 400, fontSize: 14, color: 'var(--cf-ink-secondary)', textDecoration: 'none', display: 'block', marginBottom: '0.4rem', lineHeight: 1.5 };

export function CleanFriendlyFooter({ tenant, social = {} }: Props) {
  const name = tenant.business_name || tenant.name;
  const phone = tenant.phone ?? '';
  const year = new Date().getFullYear();

  return (
    <footer style={{ backgroundColor: 'var(--cf-bg-cream)', borderTop: '1px solid var(--cf-divider)' }}>
      <div className="max-w-7xl mx-auto px-4 py-12" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: '2rem' }}>

        <div>
          {tenant.logo_url
            ? <img src={tenant.logo_url} alt={name} style={{ height: 36, objectFit: 'contain', marginBottom: 12 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            : <p style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 600, fontSize: 16, color: 'var(--cf-ink)', marginBottom: 12 }}>{name}</p>
          }
          {tenant.tagline && <p style={{ ...FOOT_LINK, fontSize: 13 }}>{tenant.tagline}</p>}
          {tenant.license_number && (
            <span style={{ display: 'inline-block', fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 12, fontWeight: 500, color: 'var(--cf-mint)', border: '1px solid var(--cf-mint)', borderRadius: 28, padding: '3px 10px', marginTop: 6 }}>
              Licensed &amp; insured
            </span>
          )}
          {(social?.facebook || social?.instagram) && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
              {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" style={{ color: 'var(--cf-ink-muted)' }}><FbIcon /></a>}
              {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ color: 'var(--cf-ink-muted)' }}><IgIcon /></a>}
            </div>
          )}
        </div>

        <div>
          <span style={COL_HEAD}>Services</span>
          {SERVICE_LINKS.map((l) => <Link key={l.href} href={l.href} style={FOOT_LINK}>{l.label}</Link>)}
        </div>

        <div>
          <span style={COL_HEAD}>Company</span>
          {COMPANY_LINKS.map((l) => <Link key={l.href} href={l.href} style={FOOT_LINK}>{l.label}</Link>)}
        </div>

        <div>
          <span style={COL_HEAD}>Contact</span>
          {phone && <a href={`tel:${phone.replace(/\D/g, '')}`} style={{ ...FOOT_LINK, color: 'var(--cf-sky)', fontWeight: 500 }}>{formatPhone(phone)}</a>}
          {tenant.email && <a href={`mailto:${tenant.email}`} style={FOOT_LINK}>{tenant.email}</a>}
          {tenant.address && <p style={FOOT_LINK}>{tenant.address}</p>}
          {tenant.hours && <p style={{ ...FOOT_LINK, fontSize: 12 }}>{tenant.hours}</p>}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--cf-divider)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <p style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 12, color: 'var(--cf-ink-muted)' }}>
          &copy; {year} {name}. All rights reserved.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/privacy" style={{ ...FOOT_LINK, fontSize: 12, marginBottom: 0 }}>Privacy Policy</Link>
          <span style={{ color: 'var(--cf-ink-muted)', fontSize: 12 }}>·</span>
          <Link href="/terms" style={{ ...FOOT_LINK, fontSize: 12, marginBottom: 0 }}>Terms of Service</Link>
          <span style={{ color: 'var(--cf-ink-muted)', fontSize: 12 }}>·</span>
          <Link href="/sms-terms" style={{ ...FOOT_LINK, fontSize: 12, marginBottom: 0 }}>SMS Terms</Link>
        </div>
        <a href="https://pestflowpro.com" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 11, color: '#E07B20', textDecoration: 'none', fontWeight: 500 }}>
          Powered by PestFlow Pro
        </a>
      </div>
    </footer>
  );
}
