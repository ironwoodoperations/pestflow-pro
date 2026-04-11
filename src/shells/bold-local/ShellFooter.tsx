import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import { useTemplate } from '../../context/TemplateContext'
import { formatPhone } from '../../lib/formatPhone'

const FbIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
const IgIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>

const SERVICE_LINKS = [
  { label: 'Mosquito Control', href: '/mosquito-control' },
  { label: 'Ant Control', href: '/ant-control' },
  { label: 'Roach Control', href: '/roach-control' },
  { label: 'Termite Control', href: '/termite-control' },
  { label: 'Rodent Control', href: '/rodent-control' },
  { label: 'Pest Control', href: '/pest-control' },
]

const COMPANY_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Service Area', href: '/service-area' },
  { label: 'Contact', href: '/contact' },
]

interface Biz { name: string; phone: string; email: string; address: string; tagline: string }
interface Social { facebook?: string; instagram?: string; google?: string }

export default function ShellFooter() {
  const { businessName: ctxName } = useTemplate()
  const [biz, setBiz] = useState<Biz>({ name: ctxName, phone: '', email: '', address: '', tagline: '' })
  const [logoUrl, setLogoUrl] = useState('')
  const [social, setSocial] = useState<Social>({})

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
        setBiz(p => ({ name: v.name || p.name, phone: v.phone || '', email: v.email || '', address: v.address || '', tagline: v.tagline || '' }))
      }
      if (brandRes.data?.value?.logo_url) setLogoUrl(brandRes.data.value.logo_url)
      if (brandRes.data?.value?.favicon_url) {
        const link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null
        if (link) link.href = brandRes.data.value.favicon_url
      }
      if (socialRes.data?.value) setSocial(socialRes.data.value)
    })
  }, [])

  const year = new Date().getFullYear()

  return (
    <footer style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e5e7eb', color: '#374151' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1 — Brand */}
          <div>
            {logoUrl
              ? <img src={logoUrl} alt={biz.name} className="h-10 w-auto object-contain mb-3" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              : <p className="text-lg font-bold mb-3" style={{ color: '#1a1a1a' }}>{biz.name}</p>
            }
            {biz.tagline && <p className="text-sm text-gray-500 mb-2">{biz.tagline}</p>}
            {biz.address && <p className="text-sm text-gray-500 mb-1">{biz.address}</p>}
            {biz.phone && <a href={`tel:${biz.phone.replace(/\D/g,'')}`} className="text-sm font-semibold block mb-2 transition" style={{ color: 'var(--color-primary)' }}>{formatPhone(biz.phone)}</a>}
            {(social.facebook || social.instagram) && (
              <div className="flex gap-3 mt-3">
                {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-gray-400 hover:text-gray-600 transition"><FbIcon /></a>}
                {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-400 hover:text-gray-600 transition"><IgIcon /></a>}
                {social.google && <a href={social.google} target="_blank" rel="noopener noreferrer" aria-label="Google Business" className="text-sm text-gray-400 hover:text-gray-600 transition font-medium">Google</a>}
              </div>
            )}
          </div>

          {/* Col 2 — Services */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide mb-4" style={{ color: '#1a1a1a' }}>Services</h3>
            <ul className="space-y-2">
              {SERVICE_LINKS.map(l => (
                <li key={l.href}>
                  <Link to={l.href} className="text-sm text-gray-500 hover:text-gray-800 transition">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Company */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide mb-4" style={{ color: '#1a1a1a' }}>Company</h3>
            <ul className="space-y-2">
              {COMPANY_LINKS.map(l => (
                <li key={l.href}>
                  <Link to={l.href} className="text-sm text-gray-500 hover:text-gray-800 transition">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Get in Touch */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide mb-4" style={{ color: '#1a1a1a' }}>Get in Touch</h3>
            {biz.address && <p className="text-sm text-gray-500 mb-2">{biz.address}</p>}
            {biz.phone && <p className="text-sm mb-1"><a href={`tel:${biz.phone.replace(/\D/g,'')}`} className="font-semibold transition" style={{ color: 'var(--color-primary)' }}>{formatPhone(biz.phone)}</a></p>}
            {biz.email && <p className="text-sm"><a href={`mailto:${biz.email}`} className="text-gray-500 hover:text-gray-800 transition">{biz.email}</a></p>}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #e5e7eb' }} className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-400">
          <span>&copy; {year} {biz.name}. All rights reserved.</span>
          <div className="flex items-center gap-3">
            <Link to="/privacy" className="hover:text-gray-600 transition">Privacy Policy</Link>
            <span>·</span>
            <Link to="/terms" className="hover:text-gray-600 transition">Terms of Service</Link>
            <span>·</span>
            <Link to="/sms-terms" className="hover:text-gray-600 transition">SMS Terms</Link>
          </div>
          <a href="https://pestflowpro.com" target="_blank" rel="noopener noreferrer" className="transition hover:opacity-80" style={{ color: 'var(--color-primary)' }}>Powered by PestFlow Pro</a>
        </div>
      </div>
    </footer>
  )
}
