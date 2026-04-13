import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import { useTemplate } from '../../context/TemplateContext'
import { formatPhone } from '../../lib/formatPhone'

const FbIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
const IgIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>
const YtIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>
const LiIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>

interface BizInfo { name: string; phone: string; email: string; address: string; hours: string; license: string; tagline: string }
interface SocialLinks { facebook?: string; instagram?: string; youtube?: string; linkedin?: string }
interface SeoSettings { service_areas?: string[] }

const SERVICES_LINKS = [
  { label: 'General Pest Control', href: '/pest-control' },
  { label: 'Termite Control', href: '/termite-control' },
  { label: 'Rodent Control', href: '/rodent-control' },
  { label: 'Mosquito Control', href: '/mosquito-control' },
  { label: 'Bed Bug Treatment', href: '/bed-bug-control' },
  { label: 'Spider Control', href: '/spider-control' },
]

export default function MetroProFooter() {
  const { businessName: ctxName } = useTemplate()
  const [biz, setBiz] = useState<BizInfo>({ name: ctxName, phone: '', email: '', address: '', hours: '', license: '', tagline: '' })
  const [social, setSocial] = useState<SocialLinks>({})
  const [seo, setSeo] = useState<SeoSettings>({})

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, socialRes, seoRes, brandRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'social_links').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'seo').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
      ])
      if (bizRes.data?.value) { const v = bizRes.data.value; setBiz(prev => ({ ...prev, ...v })) }
      if (socialRes.data?.value) setSocial(socialRes.data.value)
      if (seoRes.data?.value) setSeo(seoRes.data.value)
      if (brandRes.data?.value?.favicon_url) {
        const link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null
        if (link) link.href = brandRes.data.value.favicon_url
      }
    })
  }, [])

  const serviceAreas = (seo.service_areas || []).slice(0, 8)

  return (
    <footer style={{ backgroundColor: '#0d1f2d', color: '#ffffff' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Col 1: Connect */}
          <div className="lg:col-span-1">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-accent)' }}>Connect</h3>
            <p className="font-semibold text-white mb-2">{biz.name}</p>
            {biz.hours && <p className="text-gray-400 text-sm mb-2">{biz.hours}</p>}
            {biz.phone && (
              <a href={`tel:${biz.phone.replace(/\D/g, '')}`} className="text-xl font-bold text-white hover:text-gray-200 transition block mb-3">
                {formatPhone(biz.phone)}
              </a>
            )}
            <div className="flex gap-3 mt-2">
              {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-gray-400 hover:text-white transition"><FbIcon /></a>}
              {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-400 hover:text-white transition"><IgIcon /></a>}
              {social.youtube && <a href={social.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-gray-400 hover:text-white transition"><YtIcon /></a>}
              {social.linkedin && <a href={social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-gray-400 hover:text-white transition"><LiIcon /></a>}
            </div>
          </div>

          {/* Col 2: Company */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-accent)' }}>Company</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
              <li><Link to="/blog" className="hover:text-white transition">Blog</Link></li>
              <li><Link to="/reviews" className="hover:text-white transition">Reviews</Link></li>
              <li><span className="text-gray-500">Careers</span></li>
            </ul>
          </div>

          {/* Col 3: Services */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-accent)' }}>Services</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              {SERVICES_LINKS.map(s => (
                <li key={s.href}><Link to={s.href} className="hover:text-white transition">{s.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Col 4: Resources */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-accent)' }}>Resources</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/faq" className="hover:text-white transition">FAQ</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition">Terms of Service</Link></li>
              <li><Link to="/sms-terms" className="hover:text-white transition">SMS Terms</Link></li>
            </ul>
          </div>

          {/* Col 5: Service Areas */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-accent)' }}>Service Areas</h3>
            {serviceAreas.length > 0 ? (
              <ul className="space-y-2 text-sm text-gray-400">
                {serviceAreas.map((area, i) => (
                  <li key={i}>{area}</li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/service-area" className="hover:text-white transition">View Service Area</Link></li>
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ backgroundColor: '#06111a' }} className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
          <span>&copy; {new Date().getFullYear()} {biz.name}. All rights reserved.{biz.license ? ` License #${biz.license}.` : ''}</span>
          <div className="flex items-center gap-3">
            <Link to="/privacy" className="hover:text-gray-400 transition">Privacy</Link>
            <span>·</span>
            <Link to="/terms" className="hover:text-gray-400 transition">Terms</Link>
            <span>·</span>
            <Link to="/sms-terms" className="hover:text-gray-400 transition">SMS Terms</Link>
          </div>
          <a href="https://pestflowpro.com" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 transition">Powered by PestFlow Pro</a>
        </div>
      </div>
    </footer>
  )
}
