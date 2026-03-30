import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'

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

export default function Navbar() {
  const [businessName, setBusinessName] = useState('PestFlow Pro')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const { data } = await supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle()
      if (data?.value?.name) setBusinessName(data.value.name)
    })
  }, [])

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) { if (e.key === 'Escape') { setMobileOpen(false); setDropdownOpen(false) } }
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMobileOpen(false)
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClickOutside)
    return () => { document.removeEventListener('keydown', handleEscape); document.removeEventListener('mousedown', handleClickOutside) }
  }, [])

  function handleDropdownEnter() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setDropdownOpen(true)
  }

  function handleDropdownLeave() {
    closeTimer.current = setTimeout(() => setDropdownOpen(false), 150)
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-[#0a0f1e] font-bangers text-2xl tracking-wide">{businessName}</Link>

          <div className="hidden lg:flex items-center gap-5">
            {/* Services dropdown */}
            <div ref={dropdownRef} className="relative" onMouseEnter={handleDropdownEnter} onMouseLeave={handleDropdownLeave}>
              <button className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition flex items-center gap-1">
                Services <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white shadow-lg rounded-lg border border-gray-100 py-2 z-50">
                  {SERVICE_LINKS.map((link) => (
                    <Link key={link.href} to={link.href} onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition">
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {NAV_LINKS.map((link) => (
              <Link key={link.href} to={link.href} className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition">{link.label}</Link>
            ))}

            <Link to="/quote" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-5 py-2.5 transition">Get Free Quote</Link>
          </div>

          <button className="lg:hidden p-2 text-gray-700" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div ref={menuRef} className="lg:hidden bg-white border-t border-gray-200 max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-4 space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase px-2 pt-2 pb-1">Services</p>
            {SERVICE_LINKS.map((link) => (
              <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-sm text-gray-700 hover:text-emerald-600 transition">{link.label}</Link>
            ))}
            <div className="border-t border-gray-200 my-2" />
            {NAV_LINKS.map((link) => (
              <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-base font-medium text-gray-700 hover:text-emerald-600 transition">{link.label}</Link>
            ))}
            <Link to="/quote" onClick={() => setMobileOpen(false)} className="block text-center bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-5 py-2.5 transition mt-3">Get Free Quote</Link>
          </div>
        </div>
      )}
    </nav>
  )
}
