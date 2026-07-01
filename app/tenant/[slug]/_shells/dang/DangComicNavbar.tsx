'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Tenant } from '../../../../../shared/lib/tenant/types';
import { formatPhone } from '../../../../../shared/lib/formatPhone';
import { DangBurst } from './DangComicDevices';

interface ServiceLink { page_slug: string; title: string | null }
interface Social { facebook?: string; instagram?: string; google?: string }
interface Props { servicePages: ServiceLink[]; tenant: Tenant; social?: Social }

const PESTS: { label: string; href: string }[] = [
  { label: 'Ants', href: '/ant-control' },
  { label: 'Spiders', href: '/spider-control' },
  { label: 'Wasps & Hornets', href: '/wasp-hornet-control' },
  { label: 'Scorpions', href: '/scorpion-control' },
  { label: 'Rodents', href: '/rodent-control' },
  { label: 'Mosquitos', href: '/mosquito-control' },
  { label: 'Fleas & Ticks', href: '/flea-tick-control' },
  { label: 'Roaches', href: '/roach-control' },
  { label: 'Bed Bugs', href: '/bed-bug-control' },
  { label: 'View All', href: '/pest-control' },
];
const TERMITES = [
  { label: 'Termite Control', href: '/termite-control' },
  { label: 'Termite Inspections', href: '/termite-inspections' },
];
const ABOUT = [
  { label: 'About Us', href: '/about' },
  { label: 'Reviews', href: '/reviews' },
];

const orangeBtn: React.CSSProperties = {
  background: 'var(--dang-orange)', color: 'var(--dang-white)', border: 'var(--dang-outline)',
  fontFamily: 'var(--dang-font-display)', letterSpacing: '0.03em', textTransform: 'uppercase',
  padding: '0.5rem 1.1rem', borderRadius: 'var(--dang-radius-pill)', textDecoration: 'none',
  boxShadow: 'var(--dang-shadow-comic)', display: 'inline-block',
};

export function DangComicNavbar({ tenant }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const phone = tenant.phone ?? '';
  const tel = phone.replace(/\D/g, '');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50 }}>
      {/* ===== Desktop ===== */}
      <div
        className="hidden md:block"
        style={{
          background: scrolled ? 'var(--dang-white)' : 'var(--dang-orange)',
          borderBottom: 'var(--dang-outline)', transition: 'background 160ms ease', position: 'relative',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <nav
            style={{
              display: 'flex', alignItems: 'center', gap: '1.25rem',
              background: 'var(--dang-yellow)', border: 'var(--dang-outline)', borderRadius: 'var(--dang-radius-pill)',
              padding: '0.5rem 1.5rem', fontFamily: 'var(--dang-font-display)', textTransform: 'uppercase', letterSpacing: '0.03em',
            }}
          >
            <DrawerLink href="/pest-control" label="Pests" />
            <DrawerLink href="/mosquito-control" label="Mosquitos" />
            <DrawerLink href="/termite-control" label="Termites" />
            <DrawerLink href="/about" label="About" />
          </nav>

          {/* Burst — floating above at top, inline when scrolled */}
          <Link href="/" aria-label="Home" style={{ position: scrolled ? 'static' : 'absolute', left: '50%', top: scrolled ? undefined : '100%', transform: scrolled ? undefined : 'translate(-50%,-40%)', zIndex: 2 }}>
            <DangBurst size={scrolled ? 60 : 92} />
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {phone && (
              <a href={`tel:${tel}`} style={{ fontFamily: 'var(--dang-font-display)', color: 'var(--dang-ink)', textDecoration: 'none', letterSpacing: '0.02em' }}>
                Call us {formatPhone(phone)}
              </a>
            )}
            <Link href="/quote" style={{ ...orangeBtn, background: 'var(--dang-cyan)', color: 'var(--dang-ink)' }}>Get Your Quote</Link>
          </div>
        </div>
      </div>

      {/* ===== Mobile ===== */}
      <div className="md:hidden" style={{ background: 'var(--dang-orange)', borderBottom: 'var(--dang-outline)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem 1rem' }}>
          {phone && <a href={`tel:${tel}`} style={{ ...orangeBtn, textAlign: 'center' }}>Call Us</a>}
          {tel && <a href={`sms:${tel}`} style={{ ...orangeBtn, textAlign: 'center' }}>Text Us</a>}
          <Link href="/quote" style={{ ...orangeBtn, textAlign: 'center' }}>Get Your Quote</Link>
        </div>
        <div style={{ background: 'var(--dang-yellow)', borderTop: 'var(--dang-outline)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1rem' }}>
          <button aria-label="Open menu" onClick={() => setDrawer(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <span style={{ display: 'block', width: 26, height: 3, background: 'var(--dang-ink)', margin: '4px 0' }} />
            <span style={{ display: 'block', width: 26, height: 3, background: 'var(--dang-ink)', margin: '4px 0' }} />
            <span style={{ display: 'block', width: 26, height: 3, background: 'var(--dang-ink)', margin: '4px 0' }} />
          </button>
          <Link href="/" aria-label="Home" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
            <DangBurst size={56} />
          </Link>
          <span style={{ width: 26 }} />
        </div>
      </div>

      {/* ===== Mobile drawer ===== */}
      {drawer && (
        <>
          <div onClick={() => setDrawer(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60 }} />
          <aside style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 'min(80vw,320px)', background: 'var(--dang-white)', borderRight: 'var(--dang-outline)', zIndex: 61, overflowY: 'auto', padding: '1rem' }}>
            <button aria-label="Close menu" onClick={() => setDrawer(false)} style={{ background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', fontFamily: 'var(--dang-font-display)' }}>×</button>
            <Accordion label="Pests" isOpen={open === 'pests'} toggle={() => setOpen(open === 'pests' ? null : 'pests')} items={PESTS} onNav={() => setDrawer(false)} />
            <Accordion label="Termites" isOpen={open === 'termites'} toggle={() => setOpen(open === 'termites' ? null : 'termites')} items={TERMITES} onNav={() => setDrawer(false)} />
            <Accordion label="About" isOpen={open === 'about'} toggle={() => setOpen(open === 'about' ? null : 'about')} items={ABOUT} onNav={() => setDrawer(false)} />
            <Link href="/mosquito-control" onClick={() => setDrawer(false)} style={flatLink}>Mosquitos</Link>
            <Link href="/quote" onClick={() => setDrawer(false)} style={flatLink}>Get Your Quote</Link>
          </aside>
        </>
      )}
    </header>
  );
}

const flatLink: React.CSSProperties = {
  display: 'block', padding: '0.75rem 0.5rem', borderTop: '2px solid var(--dang-ink)',
  fontFamily: 'var(--dang-font-display)', textTransform: 'uppercase', textDecoration: 'none',
  color: 'var(--dang-ink)', letterSpacing: '0.03em',
};

function DrawerLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} style={{ color: 'var(--dang-ink)', textDecoration: 'none' }}>{label}</Link>;
}

function Accordion({ label, isOpen, toggle, items, onNav }: { label: string; isOpen: boolean; toggle: () => void; items: { label: string; href: string }[]; onNav: () => void }) {
  return (
    <div>
      <button onClick={toggle} style={{ ...flatLink, width: '100%', textAlign: 'left', background: 'none', border: 'none', borderTop: '2px solid var(--dang-ink)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span><span>{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div style={{ paddingLeft: '0.75rem' }}>
          {items.map((it) => (
            <Link key={it.href} href={it.href} onClick={onNav} style={{ display: 'block', padding: '0.5rem', textDecoration: 'none', color: 'var(--dang-text)', fontFamily: 'var(--dang-font-body)' }}>{it.label}</Link>
          ))}
        </div>
      )}
    </div>
  );
}
