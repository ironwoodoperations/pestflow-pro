import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'

const SERVICE_LINKS = [
  { label: 'Mosquito Control', href: '/mosquito-control' },
  { label: 'Spider Control', href: '/spider-control' },
  { label: 'Ant Control', href: '/ant-control' },
  { label: 'Wasp & Hornet', href: '/wasp-hornet-control' },
  { label: 'Roach Control', href: '/roach-control' },
  { label: 'Flea & Tick', href: '/flea-tick-control' },
  { label: 'Rodent Control', href: '/rodent-control' },
  { label: 'Scorpion Control', href: '/scorpion-control' },
  { label: 'Bed Bug Control', href: '/bed-bug-control' },
  { label: 'Pest Control', href: '/pest-control' },
  { label: 'Termite Control', href: '/termite-control' },
  { label: 'Termite Inspections', href: '/termite-inspections' },
]

const NAV_LINKS = [
  { label: 'Locations', href: '/service-area' },
  { label: 'Blog', href: '/blog' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

const CREAM = '#f5e6d3'
const RUST = '#c2410c'

export default function ShellNavbar() {
  const [businessName, setBusinessName] = useState('Ironclad Pest Solutions')
  const [logoUrl, setLogoUrl] = useState('')
  const [ctaText, setCtaText] = useState('Get a Free Estimate')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, brandRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
      ])
      if (bizRes.data?.value?.name) setBusinessName(bizRes.data.value.name)
      if (brandRes.data?.value?.logo_url) setLogoUrl(brandRes.data.value.logo_url)
      if (brandRes.data?.value?.cta_text) setCtaText(brandRes.data.value.cta_text)
    })
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { setMobileOpen(false); setDropdownOpen(false) } }
    function onOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMobileOpen(false)
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onOutside)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onOutside) }
  }, [])

  function onEnter() { if (closeTimer.current) clearTimeout(closeTimer.current); setDropdownOpen(true) }
  function onLeave() { closeTimer.current = setTimeout(() => setDropdownOpen(false), 150) }

  return (
    <nav style={{ backgroundColor: 'var(--color-nav-bg)' }} className="border-b border-white/10 sticky top-0 z-50">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 px-4 py-2 rounded z-[60]"
        style={{ backgroundColor: RUST, color: CREAM }}>
        Skip to main content
      </a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 text-2xl tracking-wide">
            {logoUrl
              ? <img src={logoUrl} alt={businessName} style={{ height: '40px', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              : <span style={{ color: 'var(--color-nav-text)', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{businessName}</span>
            }
          </Link>

          <div className="hidden lg:flex items-center gap-5">
            <div ref={dropdownRef} className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
              <button aria-haspopup="true" aria-expanded={dropdownOpen}
                style={{ color: CREAM }} className="text-sm font-medium transition flex items-center gap-1 hover:opacity-80">
                Services <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              {dropdownOpen && (
                <div role="menu" style={{ backgroundColor: '#4a2810' }} className="absolute top-full left-0 mt-1 w-56 shadow-xl rounded border border-white/10 py-2 z-50">
                  {SERVICE_LINKS.map((link) => (
                    <Link key={link.href} to={link.href} onClick={() => setDropdownOpen(false)}
                      style={{ color: CREAM }} className="block px-4 py-2 text-sm transition hover:opacity-80 hover:bg-white/5">
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {NAV_LINKS.map((link) => (
              <Link key={link.href} to={link.href} style={{ color: CREAM }} className="text-sm font-medium transition hover:opacity-75">{link.label}</Link>
            ))}
            <Link to="/quote" style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)', borderRadius: '4px' }} className="font-medium px-5 py-2.5 transition text-sm hover:opacity-90">
              {ctaText}
            </Link>
          </div>

          <button className="lg:hidden p-2" style={{ color: CREAM }} onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen}>
            {mobileOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div ref={menuRef} style={{ backgroundColor: 'var(--color-nav-bg)' }} className="lg:hidden border-t border-white/10 max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-4 space-y-1">
            <p className="text-xs font-semibold uppercase px-2 pt-2 pb-1" style={{ color: 'rgba(245,230,211,0.5)' }}>Services</p>
            {SERVICE_LINKS.map((link) => (
              <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)} style={{ color: CREAM }} className="block px-2 py-2 text-sm transition hover:opacity-75">{link.label}</Link>
            ))}
            <div className="border-t border-white/10 my-2" />
            {NAV_LINKS.map((link) => (
              <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)} style={{ color: CREAM }} className="block px-2 py-2 text-base font-medium transition hover:opacity-75">{link.label}</Link>
            ))}
            <Link to="/quote" onClick={() => setMobileOpen(false)} style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)', borderRadius: '4px' }} className="block text-center font-semibold px-5 py-2.5 transition mt-3">
              {ctaText}
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
