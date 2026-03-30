import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'

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
  { label: 'Services', href: '/pest-control' },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'Contact', href: '/contact' },
  { label: 'Get a Quote', href: '/quote' },
  { label: 'Service Area', href: '/service-area' },
]

export default function Footer() {
  const [info, setInfo] = useState<BusinessInfo>({
    name: 'PestFlow Pro', phone: '', email: '', address: '', hours: '', tagline: '', license: '',
  })
  const [logoUrl, setLogoUrl] = useState('')

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, brandRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
      ])
      if (bizRes.data?.value) {
        const data = bizRes.data
        setInfo((prev) => ({
          name: data.value.name || prev.name, phone: data.value.phone || '', email: data.value.email || '',
          address: data.value.address || '', hours: data.value.hours || '', tagline: data.value.tagline || '', license: data.value.license || '',
        }))
      }
      if (brandRes.data?.value?.logo_url) setLogoUrl(brandRes.data.value.logo_url)
      if (brandRes.data?.value?.favicon_url) {
        const link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null
        if (link) link.href = brandRes.data.value.favicon_url
      }
    })
  }, [])

  return (
    <footer className="bg-[#0a0f1e] text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            {logoUrl && <img src={logoUrl} alt={`${info.name} logo`} className="h-10 w-auto object-contain mb-3 brightness-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />}
            <h3 className="text-xl mb-3 text-white font-oswald tracking-wide">{info.name}</h3>
            {info.tagline && <p className="mb-2 text-gray-400">{info.tagline}</p>}
            {info.phone && <p className="mb-1"><a href={`tel:${info.phone}`} className="hover:text-emerald-400 transition">{info.phone}</a></p>}
            {info.license && <p className="text-sm text-gray-500">License #{info.license}</p>}
          </div>

          <div>
            <h3 className="text-lg mb-3 text-white font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.href + link.label}>
                  <Link to={link.href} className="hover:text-emerald-400 transition">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg mb-3 text-white font-semibold">Contact</h3>
            <ul className="space-y-2">
              {info.address && <li>{info.address}</li>}
              {info.phone && <li><a href={`tel:${info.phone}`} className="hover:text-emerald-400 transition">{info.phone}</a></li>}
              {info.email && <li><a href={`mailto:${info.email}`} className="hover:text-emerald-400 transition">{info.email}</a></li>}
              {info.hours && <li>{info.hours}</li>}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-[#060c15] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-500">
          <span>&copy; {new Date().getFullYear()} {info.name}. All rights reserved.</span>
          <span className="text-xs text-gray-600">Powered by PestFlow Pro</span>
        </div>
      </div>

      {/* SaaS watermark */}
      <div className="bg-[#040810] py-2.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs text-gray-600">
            Website by{' '}
            <span className="text-[#10b981] font-semibold hover:underline cursor-pointer">PestFlow Pro</span>
            {' '}· A product of Ironwood Operations Group
          </span>
        </div>
      </div>
    </footer>
  )
}
