import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'

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
  const [template, setTemplate] = useState<TemplateName>('modern-pro')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) { setLoading(false); return }
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('tenant_id', tenantId)
        .eq('key', 'branding')
        .maybeSingle()
      if (data?.value?.template) setTemplate(data.value.template as TemplateName)
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
