import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'

const BG    = '#111111'
const ACCENT = '#22c55e'

export default function ShellFooter() {
  const [biz, setBiz] = useState({ name: 'You Pest Control', phone: '', email: '', address: '' })

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      const { data } = await supabase
        .from('settings').select('value')
        .eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle()
      if (data?.value) setBiz(b => ({ ...b, ...data.value }))
    })
  }, [])

  return (
    <footer style={{ background: 'var(--color-footer-bg)', color: 'var(--color-footer-text)' }} className="text-sm pt-12 pb-6 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div>
          <p className="font-bold text-white text-base mb-2">{biz.name}</p>
          {biz.address && <p>{biz.address}</p>}
          {biz.phone && <p><a href={`tel:${biz.phone}`} className="hover:text-white">{biz.phone}</a></p>}
          {biz.email && <p><a href={`mailto:${biz.email}`} className="hover:text-white">{biz.email}</a></p>}
        </div>
        <div>
          <p className="font-semibold text-white mb-2">Services</p>
          <ul className="space-y-1">
            {['Pest Control', 'Termite Control', 'Mosquito Control', 'Rodent Control'].map(s => (
              <li key={s}><Link to="/pest-control" className="hover:text-white">{s}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white mb-2">Company</p>
          <ul className="space-y-1">
            {[['About', '/about'], ['Reviews', '/reviews'], ['Contact', '/contact'], ['Service Area', '/service-area']].map(([l, h]) => (
              <li key={l}><Link to={h} className="hover:text-white">{l}</Link></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between gap-2">
        <p>© {new Date().getFullYear()} {biz.name}. All rights reserved.</p>
        <p>
          Powered by{' '}
          <a href="https://pestflowpro.com" target="_blank" rel="noopener noreferrer"
            style={{ color: ACCENT }} className="font-semibold hover:underline">
            PestFlow Pro
          </a>
        </p>
      </div>
    </footer>
  )
}
