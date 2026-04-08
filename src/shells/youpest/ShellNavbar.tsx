import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import { useTemplate } from '../../context/TemplateContext'
import { formatPhone } from '../../lib/formatPhone'

const DEFAULT_LINKS = [
  { label: 'Services', href: '/pest-control' },
  { label: 'About', href: '/about' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'Contact', href: '/contact' },
]

interface NavLink { label: string; href: string }

export default function ShellNavbar() {
  const { businessName: ctxName } = useTemplate()
  const [businessName, setBusinessName] = useState(ctxName)
  const [phone, setPhone] = useState('')
  const [navStyle, setNavStyle] = useState<'solid' | 'transparent-overlay' | 'minimal'>('solid')
  const [navLinks, setNavLinks] = useState<NavLink[]>(DEFAULT_LINKS)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, layoutRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('youpest_layout').select('layout_config').eq('tenant_id', tenantId).maybeSingle(),
      ])
      if (bizRes.data?.value?.name) setBusinessName(bizRes.data.value.name)
      if (bizRes.data?.value?.phone) setPhone(bizRes.data.value.phone)
      const nav = layoutRes.data?.layout_config?.nav
      if (nav?.style) setNavStyle(nav.style)
      if (nav?.links?.length) setNavLinks(nav.links)
    })
  }, [])

  useEffect(() => {
    if (navStyle !== 'transparent-overlay') return
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [navStyle])

  const isTransparent = navStyle === 'transparent-overlay'
  const isMinimal = navStyle === 'minimal'
  const solidBg = isMinimal ? 'white' : 'var(--color-nav-bg)'
  const activeBg = isTransparent && !scrolled ? 'transparent' : solidBg
  const textColor = isMinimal ? 'var(--color-heading)' : 'var(--color-nav-text)'
  const position = isTransparent ? 'absolute top-0 left-0 right-0 z-50' : 'sticky top-0 z-50'
  const shadow = isMinimal ? 'border-b border-gray-200' : (!isTransparent || scrolled ? 'shadow-lg' : '')

  return (
    <nav
      style={{ background: activeBg, transition: 'background 0.3s ease' }}
      className={`${position} ${shadow}`}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-bold text-xl tracking-tight"
          style={{ color: isMinimal ? 'var(--color-primary)' : 'var(--color-accent)' }}>
          {businessName}
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(n => (
            <Link key={n.label} to={n.href}
              className="text-sm font-medium hover:opacity-70 transition-opacity"
              style={{ color: textColor }}>
              {n.label}
            </Link>
          ))}
          {phone && (
            <a href={`tel:${phone}`}
              style={{ background: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}
              className="px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity">
              {formatPhone(phone)}
            </a>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          style={{ color: textColor }}
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          style={{ background: solidBg, borderColor: 'rgba(255,255,255,0.1)' }}
          className="md:hidden px-4 pb-4 border-t"
        >
          {navLinks.map(n => (
            <Link key={n.label} to={n.href}
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 text-sm font-medium border-b"
              style={{ color: textColor, borderColor: 'rgba(255,255,255,0.08)' }}>
              {n.label}
            </Link>
          ))}
          {phone && (
            <a href={`tel:${phone}`}
              style={{ background: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}
              className="block mt-3 text-center px-4 py-2.5 rounded-lg text-sm font-bold">
              {formatPhone(phone)}
            </a>
          )}
        </div>
      )}
    </nav>
  )
}
