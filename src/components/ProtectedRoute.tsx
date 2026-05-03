import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTenant } from '../context/TenantBootProvider'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { id: tenantId } = useTenant()
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setLoading(false); return }
      const { data } = await supabase
        .from('tenant_users')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle()
      setAuthed(!!data)
      setLoading(false)
    })
  }, [tenantId])

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!authed) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}
