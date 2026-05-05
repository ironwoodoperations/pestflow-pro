import { createContext, useContext, type ReactNode } from 'react'
import { useTenantBoot } from './TenantBootProvider'

export type TemplateName = 'modern-pro' | 'bold-local'

interface TemplateContextValue {
  template: TemplateName
  loading: boolean
  businessName: string
}

const TemplateContext = createContext<TemplateContextValue>({
  template: 'modern-pro',
  loading: false,
  businessName: '',
})

// Thin wrapper — all data comes from TenantBootProvider above.
// Keeps providing the same interface to public themes (no theme changes needed).
export function TemplateProvider({ children }: { children: ReactNode }) {
  const { status, tenant } = useTenantBoot()

  return (
    <TemplateContext.Provider value={{
      template: (tenant?.template || 'modern-pro') as TemplateName,
      loading: status === 'loading',
      businessName: tenant?.name || '',
    }}>
      {children}
    </TemplateContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTemplate() {
  return useContext(TemplateContext)
}
