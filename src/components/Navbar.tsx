import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import { useTemplate } from '../hooks/useTemplate'

const NAV_LINKS = [
  { label: 'Services', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'Service Area', href: '/service-area' },
  { label: 'Contact', href: '/contact' },
]

export default function Navbar() {
  const { tokens, template } = useTemplate()
  const [businessName, setBusinessName] = useState('PestFlow Pro')
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('tenant_id', tenantId)
        .eq('key', 'business_info')
        .maybeSingle()
      if (data?.value?.name) setBusinessName(data.value.name)
    })
  }, [])

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const logoColor = template === 'bold' ? 'text-orange-500' : template === 'clean' ? 'text-blue-900' : 'text-teal-400'
  const linkHover = template === 'bold' ? 'hover:text-orange-400' : template === 'clean' ? 'hover:text-blue-600' : 'hover:text-teal-400'
  const navBorder = template === 'clean' ? 'border-b border-gray-200' : 'border-b border-gray-800'

  return (
    <nav className={`${tokens.navBg} ${tokens.navText} ${navBorder} sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className={`${logoColor} font-bangers text-2xl tracking-wide`}>
            {businessName}
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium ${linkHover} transition`}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/quote" className={tokens.buttonClass}>
              Get a Quote
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div ref={menuRef} className={`md:hidden ${tokens.navBg} border-t border-gray-800`}>
          <div className="px-4 py-4 space-y-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block text-base font-medium ${linkHover} transition py-2`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/quote"
              onClick={() => setMobileOpen(false)}
              className={`block text-center ${tokens.buttonClass} mt-4`}
            >
              Get a Quote
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
