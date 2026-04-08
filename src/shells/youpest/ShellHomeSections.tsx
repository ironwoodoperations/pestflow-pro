import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import { applyShellTheme } from '../../lib/shellThemes'
import SectionRenderer from './SectionRenderer'

interface LayoutConfig {
  sections?: { id?: string; type: string; [key: string]: any }[]
  colors?: { primary?: string; accent?: string }
  [key: string]: any
}

export default function ShellHomeSections() {
  const [layout, setLayout] = useState<LayoutConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) { setLoading(false); return }
      const { data } = await supabase
        .from('youpest_layout')
        .select('layout_config')
        .eq('tenant_id', tenantId)
        .maybeSingle()
      if (data?.layout_config) {
        const lc = data.layout_config as LayoutConfig
        setLayout(lc)
        // If layout has extracted brand colors, apply them over the youpest shell
        const lPrimary = lc.colors?.primary
        const lAccent  = lc.colors?.accent
        if (lPrimary) {
          applyShellTheme('youpest', lPrimary, lAccent || undefined)
        }
      }
      setLoading(false)
    })
  }, [])

  if (loading) return null

  if (!layout || !layout.sections?.length) {
    return (
      <section style={{ background: 'var(--color-bg-hero)' }}
        className="py-32 px-4 text-center">
        <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-heading)' }}>
          Site Being Built
        </h2>
        <p style={{ color: 'var(--color-heading)' }} className="opacity-60">
          Your custom site is being prepared. Check back soon.
        </p>
      </section>
    )
  }

  return <SectionRenderer sections={layout.sections} />
}
