import { useParams } from 'react-router-dom'
import LocationPage from './LocationPage'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'

export default function SlugRouter() {
  const { slug } = useParams<{ slug: string }>()
  const [type, setType] = useState<'location' | 'not-found' | 'loading'>('loading')

  useEffect(() => {
    if (!slug) { setType('not-found'); return }
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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (type === 'location') return <LocationPage slug={slug!} />
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center text-2xl">
      404 — Page Not Found
    </div>
  )
}
