import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import { useTemplate } from '../../context/TemplateContext'
import { formatPhone } from '../../lib/formatPhone'

const QUICK_LINKS = [
  ['Pest Control', '/pest-control'], ['Termite Control', '/termite-control'],
  ['Mosquito Control', '/mosquito-control'], ['Rodent Control', '/rodent-control'],
]
const COMPANY_LINKS = [
  ['About', '/about'], ['Reviews', '/reviews'], ['Contact', '/contact'], ['Get a Quote', '/quote'],
]

interface BizInfo { name: string; phone: string; email: string; address: string }

export default function ShellFooter() {
  const { businessName: ctxName } = useTemplate()
  const [biz, setBiz] = useState<BizInfo>({ name: ctxName, phone: '', email: '', address: '' })
  const [footerStyle, setFooterStyle] = useState<'full' | 'minimal' | 'centered'>('full')

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, layoutRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('youpest_layout').select('layout_config').eq('tenant_id', tenantId).maybeSingle(),
      ])
      if (bizRes.data?.value) setBiz(b => ({ ...b, ...bizRes.data!.value }))
      const style = layoutRes.data?.layout_config?.footer?.style
      if (style) setFooterStyle(style)
    })
  }, [])

  const year = new Date().getFullYear()
  const powered = (
    <a href="https://pestflowpro.com" target="_blank" rel="noopener noreferrer"
      style={{ color: 'var(--color-accent)' }} className="font-semibold hover:underline">
      PestFlow Pro
    </a>
  )

  if (footerStyle === 'minimal') {
    return (
      <footer style={{ background: 'var(--color-footer-bg)', color: 'var(--color-footer-text)' }}
        className="py-5 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-sm">
          <span className="font-semibold" style={{ color: 'var(--color-footer-text)' }}>{biz.name}</span>
          <span>© {year} {biz.name} · Powered by {powered}</span>
        </div>
      </footer>
    )
  }

  if (footerStyle === 'centered') {
    return (
      <footer style={{ background: 'var(--color-footer-bg)', color: 'var(--color-footer-text)' }}
        className="py-12 px-4 text-center text-sm">
        <p className="font-bold text-base mb-2" style={{ color: 'var(--color-footer-text)' }}>{biz.name}</p>
        {biz.address && <p className="opacity-70 mb-1">{biz.address}</p>}
        {biz.phone && <p className="mb-1"><a href={`tel:${biz.phone}`} className="hover:opacity-80">{formatPhone(biz.phone)}</a></p>}
        {biz.email && <p className="mb-4"><a href={`mailto:${biz.email}`} className="hover:opacity-80">{biz.email}</a></p>}
        <p className="opacity-60">© {year} {biz.name} · Powered by {powered}</p>
      </footer>
    )
  }

  // full — 3-column default
  return (
    <footer style={{ background: 'var(--color-footer-bg)', color: 'var(--color-footer-text)' }}
      className="text-sm pt-12 pb-6 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div>
          <p className="font-bold text-base mb-2" style={{ color: 'var(--color-footer-text)' }}>{biz.name}</p>
          {biz.address && <p className="opacity-70 mb-1">{biz.address}</p>}
          {biz.phone && <p className="mb-1"><a href={`tel:${biz.phone}`} className="hover:opacity-90">{biz.phone}</a></p>}
          {biz.email && <p><a href={`mailto:${biz.email}`} className="hover:opacity-90">{biz.email}</a></p>}
        </div>
        <div>
          <p className="font-semibold mb-2" style={{ color: 'var(--color-footer-text)' }}>Services</p>
          <ul className="space-y-1 opacity-70">
            {QUICK_LINKS.map(([l, h]) => (
              <li key={l}><Link to={h} className="hover:opacity-100">{l}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-2" style={{ color: 'var(--color-footer-text)' }}>Company</p>
          <ul className="space-y-1 opacity-70">
            {COMPANY_LINKS.map(([l, h]) => (
              <li key={l}><Link to={h} className="hover:opacity-100">{l}</Link></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t pt-4 flex flex-col md:flex-row justify-between items-center gap-3"
        style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <p className="opacity-60">© {year} {biz.name}. All rights reserved.</p>
        <div className="flex items-center gap-3 text-xs opacity-50">
          <Link to="/privacy" className="hover:opacity-100 transition">Privacy Policy</Link>
          <span>·</span>
          <Link to="/terms" className="hover:opacity-100 transition">Terms of Service</Link>
          <span>·</span>
          <Link to="/sms-terms" className="hover:opacity-100 transition">SMS Terms</Link>
        </div>
        <p className="opacity-60">Powered by {powered}</p>
      </div>
    </footer>
  )
}
