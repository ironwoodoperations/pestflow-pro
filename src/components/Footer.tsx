import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import { useTemplate } from '../hooks/useTemplate'

interface BusinessInfo {
  name: string
  phone: string
  email: string
  address: string
  hours: string
  tagline: string
  license: string
}

const QUICK_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'Contact', href: '/contact' },
  { label: 'Get a Quote', href: '/quote' },
  { label: 'Service Area', href: '/service-area' },
]

export default function Footer() {
  const { tokens, template } = useTemplate()
  const [info, setInfo] = useState<BusinessInfo>({
    name: 'PestFlow Pro',
    phone: '',
    email: '',
    address: '',
    hours: '',
    tagline: '',
    license: '',
  })

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('tenant_id', tenantId)
        .eq('key', 'business_info')
        .maybeSingle()
      if (data?.value) {
        setInfo((prev) => ({
          name: data.value.name || prev.name,
          phone: data.value.phone || '',
          email: data.value.email || '',
          address: data.value.address || '',
          hours: data.value.hours || '',
          tagline: data.value.tagline || '',
          license: data.value.license || '',
        }))
      }
    })
  }, [])

  const sectionHeading =
    template === 'bold'
      ? 'text-orange-400 font-bangers tracking-wide'
      : template === 'clean'
        ? 'text-blue-400 font-serif'
        : 'text-teal-400 font-mono'

  return (
    <footer className={`${tokens.footerBg} ${tokens.footerText}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Brand */}
          <div>
            <h3 className={`text-xl mb-3 ${sectionHeading}`}>{info.name}</h3>
            {info.tagline && <p className="mb-2">{info.tagline}</p>}
            {info.phone && (
              <p className="mb-1">
                <a href={`tel:${info.phone}`} className="hover:underline">{info.phone}</a>
              </p>
            )}
            {info.license && <p className="text-sm opacity-70">License #{info.license}</p>}
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className={`text-lg mb-3 ${sectionHeading}`}>Quick Links</h3>
            <ul className="space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.href + link.label}>
                  <Link to={link.href} className="hover:underline transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className={`text-lg mb-3 ${sectionHeading}`}>Contact</h3>
            <ul className="space-y-2">
              {info.address && <li>{info.address}</li>}
              {info.phone && (
                <li>
                  <a href={`tel:${info.phone}`} className="hover:underline">{info.phone}</a>
                </li>
              )}
              {info.email && (
                <li>
                  <a href={`mailto:${info.email}`} className="hover:underline">{info.email}</a>
                </li>
              )}
              {info.hours && <li>{info.hours}</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={`border-t ${template === 'clean' ? 'border-gray-700' : 'border-gray-800'} py-4`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2 text-sm opacity-70">
          <span>&copy; {new Date().getFullYear()} {info.name}. All rights reserved.</span>
          <span className="text-xs opacity-50">Powered by PestFlow Pro</span>
        </div>
      </div>
    </footer>
  )
}
