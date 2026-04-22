'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useTenant } from '../../TenantProvider';
import { formatPhone } from '../../../../../shared/lib/formatPhone';

const NAV_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Service Area', href: '/service-area' },
  { label: 'Blog', href: '/blog' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
];

const DEFAULT_SERVICES = [
  { label: 'Mosquito Control', href: '/mosquito-control' },
  { label: 'Ant Control', href: '/ant-control' },
  { label: 'Roach Control', href: '/roach-control' },
  { label: 'Termite Control', href: '/termite-control' },
  { label: 'Spider Control', href: '/spider-control' },
  { label: 'Rodent Control', href: '/rodent-control' },
];

interface ServiceLink { page_slug: string; title: string | null }
interface Props { servicePages: ServiceLink[] }

export function BoldLocalNavbar({ servicePages }: Props) {
  const tenant = useTenant();
  const pathname = usePathname();
  const phone = tenant.phone ?? '';
  const bizName = tenant.business_name || tenant.name;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const serviceLinks = servicePages.length > 0
    ? servicePages.slice(0, 12).map((p) => ({ label: p.title || p.page_slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), href: `/${p.page_slug}` }))
    : DEFAULT_SERVICES;

  useEffect(() => { setMobileOpen(false); setDropOpen(false); }, [pathname]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { setMobileOpen(false); setDropOpen(false); } }
    function onOut(e: MouseEvent) { if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false); }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onOut);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onOut); };
  }, []);

  function onEnter() { if (closeTimer.current) clearTimeout(closeTimer.current); setDropOpen(true); }
  function onLeave() { closeTimer.current = setTimeout(() => setDropOpen(false), 150); }

  const NAV_BG = { backgroundColor: 'var(--bl-surface)', borderBottom: '1px solid var(--bl-accent)' };
  const LINK_STYLE = { color: 'var(--bl-text-secondary)', fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 14, fontWeight: 500, textDecoration: 'none' };

  return (
    <nav style={NAV_BG} className="sticky top-0 z-50">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 px-4 py-2 z-[60]" style={{ backgroundColor: 'var(--bl-accent)', color: '#0F1216' }}>Skip to main content</a>
      <div className="max-w-7xl mx-auto px-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>

        <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          {tenant.logo_url
            ? <img src={tenant.logo_url} alt={bizName} style={{ height: 36, objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            : <span style={{ fontFamily: "var(--font-barlow,'Barlow Condensed','Oswald',sans-serif)", fontWeight: 700, fontSize: 20, color: 'var(--bl-text)' }}>{bizName}</span>
          }
        </Link>

        <div className="hidden lg:flex items-center gap-6">
          <div ref={dropRef} style={{ position: 'relative' }} onMouseEnter={onEnter} onMouseLeave={onLeave}>
            <button style={{ ...LINK_STYLE, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} onFocus={() => setDropOpen(true)} aria-haspopup="true" aria-expanded={dropOpen}>
              Services <ChevronDown size={14} aria-hidden="true" />
            </button>
            {dropOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, backgroundColor: 'var(--bl-surface-2)', border: '1px solid var(--bl-border)', minWidth: 200, zIndex: 50 }}>
                {serviceLinks.map((l) => (
                  <Link key={l.href} href={l.href} onClick={() => setDropOpen(false)} style={{ display: 'block', padding: '0.5rem 1rem', ...LINK_STYLE, textDecoration: 'none' }}>{l.label}</Link>
                ))}
              </div>
            )}
          </div>
          {NAV_LINKS.map((l) => <Link key={l.href} href={l.href} style={LINK_STYLE}>{l.label}</Link>)}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          {phone && (
            <a href={`tel:${phone.replace(/\D/g, '')}`} style={{ display: 'inline-block', backgroundColor: 'var(--bl-accent)', color: '#0F1216', fontFamily: "var(--font-barlow,'Barlow Condensed','Oswald',sans-serif)", fontWeight: 700, fontSize: 15, padding: '0.55rem 1.25rem', borderRadius: 0, textDecoration: 'none' }}>
              {formatPhone(phone)}
            </a>
          )}
        </div>

        <button className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} style={{ background: 'none', border: 'none', color: 'var(--bl-text)', cursor: 'pointer', padding: 4 }}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div style={{ backgroundColor: 'var(--bl-surface-2)', borderTop: '1px solid var(--bl-border)', maxHeight: '80vh', overflowY: 'auto' }}>
          <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--bl-text-muted)', marginBottom: '0.25rem' }}>Services</p>
            {serviceLinks.map((l) => <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} style={{ ...LINK_STYLE, padding: '0.45rem 0', display: 'block' }}>{l.label}</Link>)}
            <div style={{ borderTop: '1px solid var(--bl-border)', margin: '0.5rem 0' }} />
            {NAV_LINKS.map((l) => <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} style={{ ...LINK_STYLE, padding: '0.45rem 0', display: 'block', fontSize: 15 }}>{l.label}</Link>)}
            {phone && (
              <a href={`tel:${phone.replace(/\D/g, '')}`} onClick={() => setMobileOpen(false)} style={{ display: 'block', marginTop: '0.75rem', backgroundColor: 'var(--bl-accent)', color: '#0F1216', fontFamily: "var(--font-barlow,'Barlow Condensed','Oswald',sans-serif)", fontWeight: 700, fontSize: 15, padding: '0.75rem', textAlign: 'center', textDecoration: 'none', borderRadius: 0 }}>
                {formatPhone(phone)}
              </a>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
