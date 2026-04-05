import { useParams } from 'react-router-dom'
import LocationPage from './LocationPage'
import NotFound from './NotFound'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'

export default function SlugRouter() {
  const { slug } = useParams<{ slug: string }>()
  const [type, setType] = useState<'location' | 'not-found' | 'loading'>(() => slug ? 'loading' : 'not-found')

  useEffect(() => {
    if (!slug) return
    resolveTenantId().then(async (tenantId) => {
      const { data } = await supabase
        .from('location_data')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('slug', slug)
        .eq('is_live', true)
        .maybeSingle()
      setType(data ? 'location' : 'not-found')
    })
  }, [slug])

  if (type === 'loading') return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (type === 'location') return <LocationPage slug={slug!} />
  return <NotFound />
}
