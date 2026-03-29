import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { TEMPLATES, Template, TemplateTokens } from '../lib/templates'
import { resolveTenantId } from '../lib/tenant'

export function useTemplate(): { tokens: TemplateTokens; template: Template; loading: boolean } {
  const [template, setTemplate] = useState<Template>('bold')
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
      if (data?.value?.template) setTemplate(data.value.template as Template)
      setLoading(false)
    })
  }, [])

  return { tokens: TEMPLATES[template], template, loading }
}
