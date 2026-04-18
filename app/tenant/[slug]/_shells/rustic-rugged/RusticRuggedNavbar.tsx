'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useTenant } from '../../TenantProvider';
import { formatPhone } from '../../../../../shared/lib/formatPhone';

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

const NAV_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Service Area', href: '/service-area' },
  { label: 'Contact', href: '/contact' },
];

interface Props {
  servicePages?: { slug: string; title: string }[];
}

export function RusticRuggedNavbar({ servicePages }: Props) {
  const tenant = useTenant();
  const businessName = tenant.business_name || tenant.name;
  const logoUrl = tenant.logo_url || '';
  const phone = tenant.phone || '';
  const slug = tenant.slug;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    setDropOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMobileOpen(false); setDropOpen(false); } };
    const onClick = (e: MouseEvent) => { if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false); };
    window.addEventListener('scroll', onScroll);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => { window.removeEventListener('scroll', onScroll); document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }, []);

  const serviceLinks = servicePages?.length
    ? servicePages.map(p => ({ label: p.title, href: `/${p.slug}` }))
    : DEFAULT_SERVICE_LINKS;

  const base = `/tenant/${slug}`;

  return (
    <nav style={{ backgroundColor: '#ffffff', boxShadow: scrolled ? '0 2px 12px rgba(0,0,0,0.10)' : '0 1px 0 rgba(0,0,0,0.08)' }} className="sticky top-0 z-50 transition-shadow">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 px-4 py-2 rounded text-white z-[60]" style={{ backgroundColor: 'var(--color-primary)' }}>Skip to main content</a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href={base} className="flex items-center gap-2 shrink-0">
            {logoUrl
              ? <img src={logoUrl} alt={businessName} style={{ height: '40px', objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              : <span className="font-bold text-xl" style={{ color: '#1a1a1a', fontFamily: 'var(--font-heading)' }}>{businessName}</span>}
          </Link>

          <div className="hidden lg:flex items-center gap-5 flex-1 justify-center">
            <div ref={dropRef} className="relative"
              onMouseEnter={() => { if (timer.current) clearTimeout(timer.current); setDropOpen(true); }}
              onMouseLeave={() => { timer.current = setTimeout(() => setDropOpen(false), 150); }}>
              <button aria-haspopup="true" aria-expanded={dropOpen} className="text-sm font-medium flex items-center gap-1 transition" style={{ color: '#1a1a1a' }}>
                Services <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              {dropOpen && (
                <div role="menu" className="absolute top-full left-0 mt-1 w-52 bg-white shadow-xl rounded-lg border border-gray-100 py-2 z-50">
                  {serviceLinks.map(l => (
                    <Link key={l.href} href={`${base}${l.href}`} onClick={() => setDropOpen(false)}
                      className="block px-4 py-2 text-sm transition" style={{ color: '#1a1a1a' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#1a1a1a')}>
                      {l.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={`${base}${l.href}`} className="text-sm font-medium transition" style={{ color: '#1a1a1a' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = '#1a1a1a')}>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {phone && <a href={`tel:${phone.replace(/\D/g, '')}`} className="text-sm font-semibold transition" style={{ color: 'var(--color-primary)' }}>📞 {formatPhone(phone)}</a>}
            <Link href={`${base}/quote`} className="font-bold rounded px-5 py-2.5 text-sm text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>Free Estimate</Link>
          </div>

          <button className="lg:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} style={{ color: '#1a1a1a' }}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-4 space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase px-2 pb-1">Services</p>
            {serviceLinks.map(l => <Link key={l.href} href={`${base}${l.href}`} onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-sm font-medium" style={{ color: '#1a1a1a' }}>{l.label}</Link>)}
            <div className="border-t border-gray-100 my-2" />
            {NAV_LINKS.map(l => <Link key={l.href} href={`${base}${l.href}`} onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-base font-medium" style={{ color: '#1a1a1a' }}>{l.label}</Link>)}
            {phone && <a href={`tel:${phone.replace(/\D/g, '')}`} className="block px-2 py-2 text-base font-semibold" style={{ color: 'var(--color-primary)' }}>📞 {formatPhone(phone)}</a>}
            <Link href={`${base}/quote`} onClick={() => setMobileOpen(false)} className="block text-center font-bold rounded px-5 py-2.5 text-white transition mt-3" style={{ backgroundColor: 'var(--color-primary)' }}>Free Estimate</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
