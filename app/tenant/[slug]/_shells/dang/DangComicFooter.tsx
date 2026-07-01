import Link from 'next/link';
import type { Tenant } from '../../../../../shared/lib/tenant/types';
import { DangBurst } from './DangComicDevices';

interface Social { facebook?: string; instagram?: string; google?: string }
interface Props { tenant: Tenant; social?: Social }

const SERVICES = [
  { label: 'General Pest Control', href: '/pest-control' },
  { label: 'Termite Control', href: '/termite-control' },
  { label: 'Mosquito Control', href: '/mosquito-control' },
  { label: 'Rodent Control', href: '/rodent-control' },
  { label: 'Ant Control', href: '/ant-control' },
  { label: 'Bed Bug Control', href: '/bed-bug-control' },
];
const ABOUT = [
  { label: 'About Us', href: '/about' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
];
const LEGAL = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'SMS Terms', href: '/sms-terms' },
  { label: 'Accessibility', href: '/accessibility' },
];

const colTitle: React.CSSProperties = {
  fontFamily: 'var(--dang-font-display)', textTransform: 'uppercase', letterSpacing: '0.03em',
  fontSize: 20, marginBottom: '0.75rem', color: 'var(--dang-ink)',
};
const colLink: React.CSSProperties = {
  display: 'block', padding: '0.3rem 0', textDecoration: 'none', color: 'var(--dang-text)',
  fontFamily: 'var(--dang-font-body)',
};

function SocialCircle({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a href={href} aria-label={label} target="_blank" rel="noopener noreferrer"
      style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--dang-orange)', border: 'var(--dang-outline)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dang-white)' }}>
      {children}
    </a>
  );
}

export function DangComicFooter({ tenant, social = {} }: Props) {
  const name = tenant.business_name || tenant.name || 'Dang Pest Control';
  return (
    <footer style={{ background: 'var(--dang-surface)', borderTop: 'var(--dang-outline-thick)', color: 'var(--dang-text)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 1.25rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '2rem', alignItems: 'start' }}>
        <div>
          <p style={colTitle}>Services</p>
          {SERVICES.map((s) => <Link key={s.href} href={s.href} style={colLink}>{s.label}</Link>)}
        </div>
        <div style={{ textAlign: 'center' }}>
          <DangBurst size={130} />
          <p style={{ marginTop: '1rem', fontFamily: 'var(--dang-font-body)', color: 'var(--dang-text-muted)', maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
            Super-powered pest control for East Texas. Family-owned, community-driven.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem' }}>
            {social.facebook && <SocialCircle href={social.facebook} label="Facebook">f</SocialCircle>}
            {social.instagram && <SocialCircle href={social.instagram} label="Instagram">◎</SocialCircle>}
            {social.google && <SocialCircle href={social.google} label="Google">in</SocialCircle>}
            <SocialCircle href="https://youtube.com" label="YouTube">▶</SocialCircle>
          </div>
        </div>
        <div>
          <p style={colTitle}>About</p>
          {ABOUT.map((a) => <Link key={a.href} href={a.href} style={colLink}>{a.label}</Link>)}
        </div>
      </div>

      <div style={{ borderTop: '2px solid var(--dang-ink)', maxWidth: 1200, margin: '0 auto', padding: '1rem 1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1.25rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1.25rem' }}>
          {LEGAL.map((l) => <Link key={l.href} href={l.href} style={{ ...colLink, padding: 0, fontSize: 13 }}>{l.label}</Link>)}
        </div>
        <p style={{ fontSize: 13, color: 'var(--dang-text-muted)' }}>© 2026 {name}</p>
      </div>

      <div style={{ textAlign: 'center', padding: '0.75rem', borderTop: '2px solid var(--dang-ink)' }}>
        <a href="https://pestflowpro.ai" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--dang-orange)', fontWeight: 700, fontSize: 13, textDecoration: 'none', fontFamily: 'var(--dang-font-body)' }}>
          Powered by PestFlow Pro
        </a>
      </div>
    </footer>
  );
}
