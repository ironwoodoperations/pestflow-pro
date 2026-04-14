import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import { useTemplate } from '../../context/TemplateContext'
import { formatPhone } from '../../lib/formatPhone'

const FbIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
const IgIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>
const YtIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>

interface BusinessInfo { name: string; phone: string; email: string; address: string; hours: string; tagline: string; license: string }
interface SocialLinks { facebook?: string; instagram?: string; youtube?: string }

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/pest-control' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Blog', href: '/blog' },
  { label: 'Get a Quote', href: '/quote' },
]

export default function MetroProFooter() {
  const { businessName: ctxName } = useTemplate()
  const [biz, setBiz] = useState<BusinessInfo>({ name: ctxName, phone: '', email: '', address: '', hours: '', tagline: '', license: '' })
  const [social, setSocial] = useState<SocialLinks>({})

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, socialRes, brandRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'social_links').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
      ])
      if (bizRes.data?.value) setBiz(prev => ({ ...prev, ...bizRes.data!.value }))
      if (socialRes.data?.value) setSocial(socialRes.data.value)
      if (brandRes.data?.value?.favicon_url) {
        const link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null
        if (link) link.href = brandRes.data.value.favicon_url
      }
    })
  }, [])

  return (
    <footer style={{ backgroundColor: 'var(--color-footer-bg)', color: 'var(--color-footer-text)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Col 1: Business name + tagline + social */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-accent)' }}>About</p>
            <h3 className="text-lg font-bold text-white mb-2">{biz.name}</h3>
            {biz.tagline && <p className="text-white/60 text-sm mb-4 leading-relaxed">{biz.tagline}</p>}
            {biz.license && <p className="text-white/40 text-xs mb-3">License #{biz.license}</p>}
            {(social.facebook || social.instagram || social.youtube) && (
              <div className="flex gap-3 mt-2">
                {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-white/40 hover:text-white transition"><FbIcon /></a>}
                {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white/40 hover:text-white transition"><IgIcon /></a>}
                {social.youtube && <a href={social.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-white/40 hover:text-white transition"><YtIcon /></a>}
              </div>
            )}
          </div>

          {/* Col 2: Nav links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-accent)' }}>Navigation</p>
            <ul className="space-y-2">
              {NAV_LINKS.map(l => (
                <li key={l.href}>
                  <Link to={l.href} className="text-sm text-white/60 hover:text-white transition">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Phone + address + email */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-accent)' }}>Contact</p>
            <ul className="space-y-2 text-sm text-white/60">
              {biz.phone && (
                <li>
                  <a href={`tel:${biz.phone.replace(/\D/g, '')}`} className="hover:text-white transition font-semibold text-white">
                    {formatPhone(biz.phone)}
                  </a>
                </li>
              )}
              {biz.address && <li className="leading-snug">{biz.address}</li>}
              {biz.email && (
                <li>
                  <a href={`mailto:${biz.email}`} className="hover:text-white transition">{biz.email}</a>
                </li>
              )}
              {biz.hours && <li>{biz.hours}</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-white/30">
          <span>&copy; {new Date().getFullYear()} {biz.name}. All rights reserved.{biz.license ? ` License #${biz.license}.` : ''}</span>
          <div className="flex items-center gap-3">
            <Link to="/privacy" className="hover:text-white/60 transition">Privacy Policy</Link>
            <span>·</span>
            <Link to="/terms" className="hover:text-white/60 transition">Terms</Link>
            <span>·</span>
            <Link to="/sms-terms" className="hover:text-white/60 transition">SMS Terms</Link>
          </div>
          <a href="https://pestflowpro.com" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 transition">Powered by PestFlow Pro</a>
        </div>
      </div>
    </footer>
  )
}
