import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'
import { StructuredData } from '../StructuredData'
import { generateFAQSchema } from '../../../lib/seoSchema'

/**
 * Fetches the first 10 FAQs for this tenant and injects a valid FAQPage
 * JSON-LD schema into the page head.  Renders nothing visible.
 */
export default function DangFaqSchema() {
  const { tenantId } = useTenant()
  const [schema, setSchema] = useState<object | null>(null)

  useEffect(() => {
    if (!tenantId) return
    supabase
      .from('faqs')
      .select('question, answer')
      .eq('tenant_id', tenantId)
      .order('sort_order', { ascending: true })
      .limit(10)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setSchema(generateFAQSchema(data as { question: string; answer: string }[]))
        }
      })
  }, [tenantId])

  if (!schema) return null
  return <StructuredData data={schema} />
}
