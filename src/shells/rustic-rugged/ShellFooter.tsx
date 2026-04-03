import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Globe } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'

const FbIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
const IgIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>
const YtIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>

interface BusinessInfo { name: string; phone: string; email: string; address: string; hours: string; tagline: string; license: string }
interface SocialLinks { facebook?: string; instagram?: string; google?: string; youtube?: string }

const QUICK_LINKS = [
  { label: 'Home', href: '/' }, { label: 'Services', href: '/pest-control' },
  { label: 'About', href: '/about' }, { label: 'Blog', href: '/blog' },
  { label: 'Reviews', href: '/reviews' }, { label: 'Contact', href: '/contact' },
  { label: 'Get a Quote', href: '/quote' }, { label: 'Service Area', href: '/service-area' },
]

const CREAM = '#f5e6d3'
const RUST = '#c2410c'
const BROWN = '#3b1f0e'

export default function ShellFooter() {
  const [info, setInfo] = useState<BusinessInfo>({ name: 'Ironclad Pest Solutions', phone: '', email: '', address: '', hours: '', tagline: '', license: '' })
  const [logoUrl, setLogoUrl] = useState('')
  const [social, setSocial] = useState<SocialLinks>({})

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, brandRes, socialRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'social_links').maybeSingle(),
      ])
      if (bizRes.data?.value) {
        const v = bizRes.data.value
        setInfo(prev => ({ name: v.name || prev.name, phone: v.phone || '', email: v.email || '', address: v.address || '', hours: v.hours || '', tagline: v.tagline || '', license: v.license || '' }))
      }
      if (brandRes.data?.value?.logo_url) setLogoUrl(brandRes.data.value.logo_url)
      if (socialRes.data?.value) setSocial(socialRes.data.value)
    })
  }, [])

  return (
    <footer style={{ backgroundColor: BROWN }} className="text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            {logoUrl && <img src={logoUrl} alt={`${info.name} logo`} className="h-10 w-auto object-contain mb-3 brightness-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />}
            <h3 className="font-oswald text-xl mb-3 font-bold" style={{ color: CREAM }}>{info.name}</h3>
            {info.tagline && <p className="mb-2 text-sm" style={{ color: 'rgba(245,230,211,0.75)' }}>{info.tagline}</p>}
            {info.phone && <p className="mb-1"><a href={`tel:${info.phone}`} style={{ color: CREAM }} className="transition hover:opacity-75">{info.phone}</a></p>}
            {info.license && <p className="text-xs" style={{ color: 'rgba(245,230,211,0.5)' }}>License #{info.license}</p>}
            {(social.facebook || social.instagram || social.google || social.youtube) && (
              <div className="flex gap-3 mt-3">
                {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" style={{ color: CREAM }} className="transition hover:opacity-75"><FbIcon /></a>}
                {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ color: CREAM }} className="transition hover:opacity-75"><IgIcon /></a>}
                {social.google && <a href={social.google} target="_blank" rel="noopener noreferrer" aria-label="Google Business" style={{ color: CREAM }} className="transition hover:opacity-75"><Globe className="w-5 h-5" /></a>}
                {social.youtube && <a href={social.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" style={{ color: CREAM }} className="transition hover:opacity-75"><YtIcon /></a>}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-oswald text-lg mb-3 font-bold" style={{ color: CREAM }}>Quick Links</h3>
            <ul className="space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.href + link.label}>
                  <Link to={link.href} style={{ color: CREAM }} className="transition hover:opacity-75">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-oswald text-lg mb-3 font-bold" style={{ color: CREAM }}>Contact</h3>
            <ul className="space-y-2" style={{ color: CREAM }}>
              {info.address && <li>{info.address}</li>}
              {info.phone && <li><a href={`tel:${info.phone}`} style={{ color: CREAM }} className="transition hover:opacity-75">{info.phone}</a></li>}
              {info.email && <li><a href={`mailto:${info.email}`} style={{ color: CREAM }} className="transition hover:opacity-75">{info.email}</a></li>}
              {info.hours && <li>{info.hours}</li>}
            </ul>
          </div>
        </div>
      </div>
      <div style={{ borderTop: `1px solid rgba(245,230,211,0.2)` }} className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span className="text-xs" style={{ color: 'rgba(245,230,211,0.6)' }}>&copy; {new Date().getFullYear()} {info.name}. All rights reserved.</span>
          <span className="text-xs font-semibold" style={{ color: RUST }}>Powered by PestFlow Pro</span>
        </div>
      </div>
    </footer>
  )
}
