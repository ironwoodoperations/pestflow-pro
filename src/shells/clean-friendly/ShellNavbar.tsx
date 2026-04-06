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

export default function ShellNavbar() {
  const [businessName, setBusinessName] = useState('Ironclad Pest Solutions')
  const [logoUrl, setLogoUrl] = useState('')
  const [ctaText, setCtaText] = useState('Get a Free Quote')
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
    <nav style={{ backgroundColor: 'var(--color-nav-bg)' }} className="shadow-sm sticky top-0 z-50">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-sky-600 text-white px-4 py-2 rounded-lg z-[60]">
        Skip to main content
      </a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            {logoUrl && <img src={logoUrl} alt={`${businessName} logo`} className="h-10 w-auto object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />}
            <span className="font-raleway text-xl font-bold text-sky-700 tracking-tight">{businessName}</span>
          </Link>

          <div className="hidden lg:flex items-center gap-5">
            <div ref={dropdownRef} className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
              <button aria-haspopup="true" aria-expanded={dropdownOpen} className="font-raleway text-sm font-medium text-slate-700 hover:text-sky-600 transition flex items-center gap-1">
                Services <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              {dropdownOpen && (
                <div role="menu" className="absolute top-full left-0 mt-2 w-56 bg-white shadow-lg rounded-xl border border-gray-100 py-2 z-50">
                  {SERVICE_LINKS.map((link) => (
                    <Link key={link.href} to={link.href} onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm font-raleway text-slate-700 hover:text-sky-600 hover:bg-sky-50 transition">
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {NAV_LINKS.map((link) => (
              <Link key={link.href} to={link.href} className="font-raleway text-sm font-medium text-slate-700 hover:text-sky-600 transition">{link.label}</Link>
            ))}
            <Link to="/quote" style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }} className="font-raleway font-semibold rounded-full px-5 py-2 transition text-sm">{ctaText}</Link>
          </div>

          <button className="lg:hidden p-2 text-slate-700" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen}>
            {mobileOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div ref={menuRef} style={{ backgroundColor: 'var(--color-nav-bg)' }} className="lg:hidden border-t border-gray-100 max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-4 space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase px-2 pt-2 pb-1">Services</p>
            {SERVICE_LINKS.map((link) => (
              <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-sm font-raleway text-slate-700 hover:text-sky-600 transition">{link.label}</Link>
            ))}
            <div className="border-t border-gray-100 my-2" />
            {NAV_LINKS.map((link) => (
              <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)} className="block px-2 py-2 font-raleway text-base font-medium text-slate-700 hover:text-sky-600 transition">{link.label}</Link>
            ))}
            <Link to="/quote" onClick={() => setMobileOpen(false)} style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }} className="block text-center font-raleway font-semibold rounded-full px-5 py-2.5 transition mt-3">{ctaText}</Link>
          </div>
        </div>
      )}
    </nav>
  )
}
