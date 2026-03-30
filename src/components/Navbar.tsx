import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'

const NAV_LINKS = [
  { label: 'Services', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'Service Area', href: '/service-area' },
  { label: 'Contact', href: '/contact' },
]

export default function Navbar() {
  const [businessName, setBusinessName] = useState('PestFlow Pro')
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const { data } = await supabase
        .from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle()
      if (data?.value?.name) setBusinessName(data.value.name)
    })
  }, [])

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) { if (e.key === 'Escape') setMobileOpen(false) }
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMobileOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClickOutside)
    return () => { document.removeEventListener('keydown', handleEscape); document.removeEventListener('mousedown', handleClickOutside) }
  }, [])

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-[#0a0f1e] font-bangers text-2xl tracking-wide">
            {businessName}
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} to={link.href} className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition">
                {link.label}
              </Link>
            ))}
            <Link to="/quote" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-5 py-2.5 transition">
              Get Free Quote
            </Link>
          </div>

          <button className="md:hidden p-2 text-gray-700" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div ref={menuRef} className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-3">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)} className="block text-base font-medium text-gray-700 hover:text-emerald-600 transition py-2">
                {link.label}
              </Link>
            ))}
            <Link to="/quote" onClick={() => setMobileOpen(false)} className="block text-center bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-5 py-2.5 transition mt-4">
              Get Free Quote
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
