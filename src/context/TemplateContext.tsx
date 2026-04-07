import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import { applyShellTheme } from '../lib/shellThemes'

export type TemplateName = 'modern-pro' | 'bold-local' | 'clean-friendly' | 'rustic-rugged' | 'youpest'

interface TemplateContextValue {
  template: TemplateName
  loading: boolean
}

const TemplateContext = createContext<TemplateContextValue>({
  template: 'modern-pro',
  loading: true,
})

export function TemplateProvider({ children }: { children: ReactNode }) {
  const [template, setTemplate] = useState<TemplateName>(
    (localStorage.getItem('pfp_template') || 'modern-pro') as TemplateName
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Apply cached colors immediately to eliminate flash
    const cachedTemplate = (localStorage.getItem('pfp_template') || 'modern-pro') as TemplateName
    const cachedPrimary = localStorage.getItem('pfp_primary_color') || undefined
    const cachedAccent = localStorage.getItem('pfp_accent_color') || undefined
    applyShellTheme(cachedTemplate, cachedPrimary, cachedAccent)

    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) { setLoading(false); return }
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('tenant_id', tenantId)
        .eq('key', 'branding')
        .maybeSingle()
      if (data?.value?.template) {
        const t = data.value.template as TemplateName
        const primary = data.value.primary_color as string | undefined
        const accent = data.value.accent_color as string | undefined
        setTemplate(t)
        applyShellTheme(t, primary, accent)
        localStorage.setItem('pfp_template', t)
        if (primary) localStorage.setItem('pfp_primary_color', primary)
        if (accent) localStorage.setItem('pfp_accent_color', accent)
      }
      setLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <TemplateContext.Provider value={{ template, loading }}>
      {children}
    </TemplateContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTemplate() {
  return useContext(TemplateContext)
}
