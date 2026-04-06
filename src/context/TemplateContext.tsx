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
  const cached = (localStorage.getItem('pfp_template') || 'modern-pro') as TemplateName
  const [template, setTemplate] = useState<TemplateName>(cached)
  const [loading, setLoading] = useState(true)

  // Apply cached theme immediately to eliminate flash
  useEffect(() => {
    applyShellTheme(cached)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
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
        setTemplate(t)
        applyShellTheme(t, data.value.primary_color, data.value.accent_color)
        localStorage.setItem('pfp_template', t)
      }
      setLoading(false)
    })
  }, [])

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
