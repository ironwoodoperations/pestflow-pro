import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import { applyShellTheme } from '../lib/shellThemes'

export type TemplateName = 'modern-pro' | 'bold-local' | 'clean-friendly' | 'rustic-rugged' | 'youpest' | 'dang'

interface TemplateContextValue {
  template: TemplateName
  loading: boolean
  businessName: string
}

const TemplateContext = createContext<TemplateContextValue>({
  template: 'modern-pro',
  loading: true,
  businessName: '',
})

export function TemplateProvider({ children }: { children: ReactNode }) {
  const [template, setTemplate] = useState<TemplateName>(
    (localStorage.getItem('pfp_template') || 'modern-pro') as TemplateName
  )
  const [loading, setLoading] = useState(true)
  const [businessName, setBusinessName] = useState('')

  useEffect(() => {
    // Apply cached colors immediately to eliminate flash
    const cachedTemplate = (localStorage.getItem('pfp_template') || 'modern-pro') as TemplateName
    const cachedPrimary = localStorage.getItem('pfp_primary_color') || undefined
    const cachedAccent = localStorage.getItem('pfp_accent_color') || undefined
    applyShellTheme(cachedTemplate, cachedPrimary, cachedAccent)

    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) { setLoading(false); return }
      const [brandRes, bizRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
      ])
      if (brandRes.data?.value?.template) {
        const t = brandRes.data.value.template as TemplateName
        const primary = brandRes.data.value.primary_color as string | undefined
        const accent = brandRes.data.value.accent_color as string | undefined
        setTemplate(t)
        applyShellTheme(t, primary, accent)
        localStorage.setItem('pfp_template', t)
        if (primary) localStorage.setItem('pfp_primary_color', primary)
        if (accent) localStorage.setItem('pfp_accent_color', accent)
      }
      if (bizRes.data?.value?.name) setBusinessName(bizRes.data.value.name)
      setLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <TemplateContext.Provider value={{ template, loading, businessName }}>
      {children}
    </TemplateContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTemplate() {
  return useContext(TemplateContext)
}
