'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useTenant } from '../../TenantProvider';
import { formatPhone } from '../../../../../shared/lib/formatPhone';

const NAV_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Service area', href: '/service-area' },
  { label: 'Blog', href: '/blog' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
];

const DEFAULT_SERVICES = [
  { label: 'Mosquito control', href: '/mosquito-control' },
  { label: 'Ant control', href: '/ant-control' },
  { label: 'Roach control', href: '/roach-control' },
  { label: 'Termite control', href: '/termite-control' },
  { label: 'Spider control', href: '/spider-control' },
  { label: 'Rodent control', href: '/rodent-control' },
];

interface ServiceLink { page_slug: string; title: string | null }
interface Props { servicePages: ServiceLink[] }

export function CleanFriendlyNavbar({ servicePages }: Props) {
  const tenant = useTenant();
  const pathname = usePathname();
  const phone = tenant.phone ?? '';
  const bizName = tenant.business_name || tenant.name;
  const ctaText = tenant.cta_text || 'Get a free quote';

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

  const LINK: React.CSSProperties = { fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 15, color: 'var(--cf-ink)', textDecoration: 'none' };

  return (
    <nav style={{ backgroundColor: 'var(--cf-surface)', borderBottom: '1px solid var(--cf-divider)' }} className="sticky top-0 z-50">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 px-4 py-2 z-[60]" style={{ backgroundColor: 'var(--cf-ink)', color: 'var(--cf-surface)', borderRadius: 28 }}>Skip to main content</a>
      <div className="max-w-7xl mx-auto px-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>

        <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          {tenant.logo_url
            ? <img src={tenant.logo_url} alt={bizName} style={{ height: 36, objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            : <span style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 600, fontSize: 18, color: 'var(--cf-ink)' }}>{bizName}</span>
          }
        </Link>

        <div className="hidden lg:flex items-center gap-6">
          <div ref={dropRef} style={{ position: 'relative' }} onMouseEnter={onEnter} onMouseLeave={onLeave}>
            <button style={{ ...LINK, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} onFocus={() => setDropOpen(true)} aria-haspopup="true" aria-expanded={dropOpen}>
              Services <ChevronDown size={14} aria-hidden="true" />
            </button>
            {dropOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, backgroundColor: 'var(--cf-surface-card)', border: '1px solid var(--cf-divider)', borderRadius: 12, minWidth: 210, zIndex: 50, boxShadow: '0 4px 16px rgba(31,58,77,0.08)', padding: '0.5rem 0' }}>
                {serviceLinks.map((l) => (
                  <Link key={l.href} href={l.href} onClick={() => setDropOpen(false)} style={{ display: 'block', padding: '0.5rem 1rem', ...LINK, fontSize: 14 }}>{l.label}</Link>
                ))}
              </div>
            )}
          </div>
          {NAV_LINKS.map((l) => <Link key={l.href} href={l.href} style={LINK}>{l.label}</Link>)}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          {phone && (
            <span style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 400, fontSize: 14, color: 'var(--cf-ink-muted)' }}>
              {formatPhone(phone)}
            </span>
          )}
          <Link href="/quote" style={{ display: 'inline-block', backgroundColor: 'var(--cf-ink)', color: 'var(--cf-surface)', fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 14, padding: '0.55rem 1.25rem', borderRadius: 28, textDecoration: 'none' }}>
            {ctaText}
          </Link>
        </div>

        <button className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} style={{ background: 'none', border: 'none', color: 'var(--cf-ink)', cursor: 'pointer', padding: 4 }}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div style={{ backgroundColor: 'var(--cf-surface)', borderTop: '1px solid var(--cf-divider)', maxHeight: '80vh', overflowY: 'auto' }}>
          <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <p style={{ fontFamily: "Georgia,'Source Serif Pro',serif", fontStyle: 'italic', fontSize: 11, color: 'var(--cf-ink-muted)', marginBottom: '0.25rem' }}>our services</p>
            {serviceLinks.map((l) => <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} style={{ ...LINK, fontSize: 15, padding: '0.45rem 0', display: 'block' }}>{l.label}</Link>)}
            <div style={{ borderTop: '1px solid var(--cf-divider)', margin: '0.5rem 0' }} />
            {NAV_LINKS.map((l) => <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} style={{ ...LINK, fontSize: 15, padding: '0.45rem 0', display: 'block' }}>{l.label}</Link>)}
            <Link href="/quote" onClick={() => setMobileOpen(false)} style={{ display: 'block', textAlign: 'center', marginTop: '0.75rem', backgroundColor: 'var(--cf-ink)', color: 'var(--cf-surface)', fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 15, padding: '0.75rem', borderRadius: 28, textDecoration: 'none' }}>
              {ctaText}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
