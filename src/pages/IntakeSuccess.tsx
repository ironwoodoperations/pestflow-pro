import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ModernProPreview from '../components/intake-success/ModernProPreview'
import CleanFriendlyPreview from '../components/intake-success/CleanFriendlyPreview'
import BoldLocalPreview from '../components/intake-success/BoldLocalPreview'
import RusticRuggedPreview from '../components/intake-success/RusticRuggedPreview'
import MetroProPreview from '../components/intake-success/MetroProPreview'

interface PreviewProps {
  businessName: string
  tagline: string
  phone: string
  primaryColor: string
  accentColor: string
}

const PREVIEWS: Record<string, React.ComponentType<PreviewProps>> = {
  'modern-pro':      ModernProPreview,
  'clean-friendly':  CleanFriendlyPreview,
  'bold-local':      BoldLocalPreview,
  'rustic-rugged':   RusticRuggedPreview,
  'metro-pro':       MetroProPreview,
}

const SUBTEXTS = [
  "Our team is crafting your digital home base. Sit tight — good things take a little time.",
  "Next up: a website that works as hard as you do. We'll have it ready before you can say 'pest-free'.",
  "Your competition won't know what hit them. We're building something great.",
]

interface BrandData {
  businessName: string
  tagline: string
  phone: string
  primaryColor: string
  accentColor: string
  template: string
}

export default function IntakeSuccess() {
  const [params] = useSearchParams()
  const slug = params.get('slug') || ''
  const [subtext] = useState(() => SUBTEXTS[Math.floor(Math.random() * SUBTEXTS.length)])
  const [brand, setBrand] = useState<BrandData>({
    businessName: '', tagline: '', phone: '',
    primaryColor: '#1e40af', accentColor: '#f59e0b', template: 'modern-pro',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) { setLoading(false); return }
    ;(async () => {
      const { data: tenant } = await supabase
        .from('tenants').select('id').eq('slug', slug).maybeSingle()
      if (!tenant) { setLoading(false); return }
      const { data: rows } = await supabase
        .from('settings').select('key,value')
        .eq('tenant_id', tenant.id)
        .in('key', ['branding', 'business_info'])
      const b  = rows?.find(r => r.key === 'branding')?.value     || {}
      const bi = rows?.find(r => r.key === 'business_info')?.value || {}
      setBrand({
        businessName:  bi.name          || '',
        tagline:       bi.tagline       || '',
        phone:         bi.phone         || '',
        primaryColor:  b.primary_color  || '#1e40af',
        accentColor:   b.accent_color   || '#f59e0b',
        template:      b.template       || 'modern-pro',
      })
      setLoading(false)
    })()
  }, [slug])

  const Preview = PREVIEWS[brand.template] || ModernProPreview
  const previewProps: PreviewProps = {
    businessName: brand.businessName || 'Your Business',
    tagline:      brand.tagline      || 'Professional Pest Control',
    phone:        brand.phone        || '(555) 000-0000',
    primaryColor: brand.primaryColor,
    accentColor:  brand.accentColor,
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ '--color-primary': brand.primaryColor, '--color-accent': brand.accentColor } as React.CSSProperties}
    >
      {/* Blurred shell mockup — purely decorative backdrop */}
      <div
        aria-hidden
        style={{ filter: 'blur(3px)', opacity: 0.4, pointerEvents: 'none', userSelect: 'none' }}
      >
        {!loading && <Preview {...previewProps} />}
      </div>

      {/* Dark scrim */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.58)' }} />

      {/* Overlay card */}
      <div className="absolute inset-0 flex items-center justify-center px-4" style={{ zIndex: 10 }}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-lg w-full text-center">
          <div className="text-5xl mb-4 animate-bounce select-none">🚀</div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Your New Site Is Being Built!
          </h1>
          {brand.businessName && (
            <p className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              {brand.businessName}
            </p>
          )}
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">{subtext}</p>
          <span className="inline-block bg-orange-50 text-orange-600 text-xs font-semibold px-3 py-1 rounded-full border border-orange-200">
            ⚡ Powered by PestFlow Pro
          </span>
        </div>
      </div>
    </div>
  )
}
