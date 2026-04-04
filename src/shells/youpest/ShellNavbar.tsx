import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'

const NAV = [
  { label: 'Services', href: '/pest-control' },
  { label: 'Service Area', href: '/service-area' },
  { label: 'About', href: '/about' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'Contact', href: '/contact' },
]

// Brand: dark charcoal + bright green — from You Pest Control identity
const BG   = '#1a1a1a'
const ACCENT = '#22c55e'

export default function ShellNavbar() {
  const [businessName, setBusinessName] = useState('You Pest Control')
  const [phone, setPhone] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      const { data } = await supabase
        .from('settings').select('value')
        .eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle()
      if (data?.value?.name) setBusinessName(data.value.name)
      if (data?.value?.phone) setPhone(data.value.phone)
    })
  }, [])

  return (
    <nav style={{ background: BG }} className="sticky top-0 z-50 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-bold text-xl tracking-tight" style={{ color: ACCENT }}>
          {businessName}
        </Link>
        <div className="hidden md:flex items-center gap-6">
          {NAV.map(n => (
            <Link key={n.label} to={n.href} className="text-gray-300 hover:text-white text-sm font-medium transition">
              {n.label}
            </Link>
          ))}
          {phone && (
            <a href={`tel:${phone}`} style={{ background: ACCENT }}
              className="px-4 py-2 rounded-lg text-white text-sm font-bold hover:opacity-90 transition">
              {phone}
            </a>
          )}
        </div>
        <button className="md:hidden text-white" onClick={() => setMobileOpen(o => !o)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {mobileOpen && (
        <div style={{ background: BG }} className="md:hidden border-t border-gray-700 px-4 pb-4">
          {NAV.map(n => (
            <Link key={n.label} to={n.href} onClick={() => setMobileOpen(false)}
              className="block py-2 text-gray-300 text-sm font-medium border-b border-gray-800">
              {n.label}
            </Link>
          ))}
          {phone && (
            <a href={`tel:${phone}`} style={{ background: ACCENT }}
              className="block mt-3 text-center px-4 py-2 rounded-lg text-white text-sm font-bold">
              {phone}
            </a>
          )}
        </div>
      )}
    </nav>
  )
}
