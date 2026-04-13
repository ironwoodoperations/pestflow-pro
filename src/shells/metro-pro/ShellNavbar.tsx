import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Phone, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import { useTemplate } from '../../context/TemplateContext'
import { formatPhone } from '../../lib/formatPhone'

const SERVICE_LINKS = [
  { label: 'General Pest Control', href: '/pest-control' },
  { label: 'Termite Control', href: '/termite-control' },
  { label: 'Rodent Control', href: '/rodent-control' },
  { label: 'Mosquito Control', href: '/mosquito-control' },
  { label: 'Bed Bug Treatment', href: '/bed-bug-control' },
  { label: 'Spider Control', href: '/spider-control' },
  { label: 'Ant Control', href: '/ant-control' },
  { label: 'Wasp & Hornet', href: '/wasp-hornet-control' },
]

const NAV_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

export default function MetroProNavbar() {
  const { businessName: ctxName } = useTemplate()
  const [businessName, setBusinessName] = useState(ctxName)
  const [logoUrl, setLogoUrl] = useState('')
  const [phone, setPhone] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
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
      if (bizRes.data?.value?.phone) setPhone(bizRes.data.value.phone)
      if (brandRes.data?.value?.logo_url) setLogoUrl(brandRes.data.value.logo_url)
    })
  }, [])

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 80) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') { setMobileOpen(false); setDropdownOpen(false) } }
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMobileOpen(false)
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleOutside)
    return () => { document.removeEventListener('keydown', handleKey); document.removeEventListener('mousedown', handleOutside) }
  }, [])

  function onEnter() { if (closeTimer.current) clearTimeout(closeTimer.current); setDropdownOpen(true) }
  function onLeave() { closeTimer.current = setTimeout(() => setDropdownOpen(false), 150) }

  return (
    <nav
      className={`sticky top-0 z-50 bg-white transition-shadow ${scrolled ? 'shadow-md' : 'border-b border-gray-100'}`}
    >
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 px-4 py-2 rounded-lg z-[60] text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
        Skip to main content
      </a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + phone */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center">
              {logoUrl
                ? <img src={logoUrl} alt={businessName} style={{ height: '38px', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                : <span className="text-xl font-bold" style={{ color: '#1a1a1a', fontFamily: 'Inter, sans-serif' }}>{businessName}</span>
              }
            </Link>
            {phone && (
              <a href={`tel:${phone.replace(/\D/g, '')}`} className="hidden md:flex items-center gap-1.5 text-sm font-medium transition hover:opacity-80" style={{ color: 'var(--color-primary)' }}>
                <Phone className="w-4 h-4" />
                {formatPhone(phone)}
              </a>
            )}
          </div>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">Home</Link>

            <div ref={dropdownRef} className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
              <button aria-haspopup="true" aria-expanded={dropdownOpen} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition flex items-center gap-1">
                Services <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {dropdownOpen && (
                <div role="menu" className="absolute top-full left-0 mt-1 w-56 bg-white shadow-xl rounded-lg border border-gray-100 py-2 z-50">
                  {SERVICE_LINKS.map((link) => (
                    <Link key={link.href} to={link.href} onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition">
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {NAV_LINKS.map((link) => (
              <Link key={link.href} to={link.href} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">{link.label}</Link>
            ))}

            <Link to="/quote" className="text-sm font-semibold px-5 py-2 rounded-full text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
              Get Free Quote
            </Link>
          </div>

          <button className="lg:hidden p-2 text-gray-600" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div ref={menuRef} className="lg:hidden border-t border-gray-100 bg-white max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-4 space-y-1">
            {phone && (
              <a href={`tel:${phone.replace(/\D/g, '')}`} className="flex items-center gap-2 px-2 py-2 text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                <Phone className="w-4 h-4" />{formatPhone(phone)}
              </a>
            )}
            <Link to="/" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-sm font-medium text-gray-700">Home</Link>
            <p className="text-xs font-semibold text-gray-400 uppercase px-2 pt-2 pb-1">Services</p>
            {SERVICE_LINKS.map((link) => (
              <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-sm text-gray-600 hover:text-gray-900 transition">{link.label}</Link>
            ))}
            <div className="border-t border-gray-100 my-2" />
            {NAV_LINKS.map((link) => (
              <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-sm font-medium text-gray-700">{link.label}</Link>
            ))}
            <Link to="/quote" onClick={() => setMobileOpen(false)} className="block text-center font-semibold rounded-full px-5 py-2.5 text-white mt-3 transition hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
              Get Free Quote
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
