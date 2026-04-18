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
  { label: 'Contact', href: '/contact' },
];

interface ServiceLink { page_slug: string; title: string | null }

const DEFAULT_SERVICE_LINKS = [
  { label: 'Mosquito Control', href: '/mosquito-control' },
  { label: 'Ant Control', href: '/ant-control' },
  { label: 'Roach Control', href: '/roach-control' },
  { label: 'Spider Control', href: '/spider-control' },
  { label: 'Termite Control', href: '/termite-control' },
  { label: 'Bed Bug Control', href: '/bed-bug-control' },
  { label: 'Rodent Control', href: '/rodent-control' },
  { label: 'Wasp & Hornet', href: '/wasp-hornet-control' },
  { label: 'Flea & Tick', href: '/flea-tick-control' },
  { label: 'Scorpion Control', href: '/scorpion-control' },
  { label: 'Pest Control', href: '/pest-control' },
  { label: 'Termite Inspections', href: '/termite-inspections' },
];

interface Props {
  servicePages: ServiceLink[];
}

export function BoldLocalNavbar({ servicePages }: Props) {
  const tenant = useTenant();
  const pathname = usePathname();
  const logoUrl = tenant.logo_url ?? '';
  const phone = tenant.phone ?? '';
  const businessName = tenant.business_name || tenant.name;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const serviceLinks = servicePages.length > 0
    ? servicePages.map((p) => ({
        label: p.title || p.page_slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        href: `/${p.page_slug}`,
      }))
    : DEFAULT_SERVICE_LINKS;

  useEffect(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setDropdownOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { setMobileOpen(false); setDropdownOpen(false); } }
    function onClickOut(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickOut);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClickOut); };
  }, []);

  function onEnter() { if (closeTimer.current) clearTimeout(closeTimer.current); setDropdownOpen(true); }
  function onLeave() { closeTimer.current = setTimeout(() => setDropdownOpen(false), 150); }

  const navStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    boxShadow: scrolled ? '0 2px 12px rgba(0,0,0,0.10)' : '0 1px 0 rgba(0,0,0,0.08)',
  };

  return (
    <nav style={navStyle} className="sticky top-0 z-50 transition-shadow">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 px-4 py-2 rounded-lg z-[60] text-white"
        style={{ backgroundColor: 'var(--color-primary)' }}>Skip to main content</a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          <Link href="/" className="flex items-center gap-2 shrink-0">
            {logoUrl
              ? <img src={logoUrl} alt={businessName} style={{ height: '40px', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              : <span className="font-bold text-xl" style={{ color: '#1a1a1a', fontFamily: 'var(--font-heading)' }}>{businessName}</span>
            }
          </Link>

          <div className="hidden lg:flex items-center gap-5 flex-1 justify-center">
            <div ref={dropdownRef} className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
              <button aria-haspopup="true" aria-expanded={dropdownOpen}
                className="text-sm font-medium flex items-center gap-1 transition"
                style={{ color: '#1a1a1a' }}
                onFocus={() => setDropdownOpen(true)}>
                Services <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              {dropdownOpen && (
                <div role="menu" className="absolute top-full left-0 mt-1 w-52 bg-white shadow-xl rounded-lg border border-gray-100 py-2 z-50">
                  {serviceLinks.map((l) => (
                    <Link key={l.href} href={l.href} onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm transition hover:text-[color:var(--color-primary)]"
                      style={{ color: '#1a1a1a' }}>
                      {l.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href}
                className="text-sm font-medium transition hover:text-[color:var(--color-primary)]"
                style={{ color: '#1a1a1a' }}>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {phone && (
              <a href={`tel:${phone.replace(/\D/g, '')}`} className="text-sm font-semibold transition"
                style={{ color: 'var(--color-primary)' }}>
                {formatPhone(phone)}
              </a>
            )}
            <Link href="/quote" className="font-bold rounded-full px-5 py-2.5 text-sm transition hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}>
              Get a Quote
            </Link>
          </div>

          <button className="lg:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'} style={{ color: '#1a1a1a' }}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-4 space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase px-2 pb-1">Services</p>
            {serviceLinks.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                className="block px-2 py-2 text-sm font-medium" style={{ color: '#1a1a1a' }}>{l.label}</Link>
            ))}
            <div className="border-t border-gray-100 my-2" />
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                className="block px-2 py-2 text-base font-medium" style={{ color: '#1a1a1a' }}>{l.label}</Link>
            ))}
            {phone && (
              <a href={`tel:${phone.replace(/\D/g, '')}`} className="block px-2 py-2 text-base font-semibold"
                style={{ color: 'var(--color-primary)' }}>{formatPhone(phone)}</a>
            )}
            <Link href="/quote" onClick={() => setMobileOpen(false)}
              className="block text-center font-bold rounded-full px-5 py-2.5 transition mt-3"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}>
              Get a Quote
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
