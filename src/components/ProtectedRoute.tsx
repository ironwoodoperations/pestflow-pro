import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTenant } from '../context/TenantBootProvider'
import { isValidRole } from '../lib/permissions'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { id: tenantId } = useTenant()
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setLoading(false); return }
      // S273 PR #2a — admit ANY valid tenant role (admin/manager/user). The route
      // is the membership gate; per-surface access is decided by the permission map
      // (src/lib/permissions.ts) and enforced server-side by content-table RLS. This
      // resolves the prior mismatch where ProtectedRoute demanded role='admin' while
      // Login admitted any membership row (Manager/User authenticated then bounced).
      const { data } = await supabase
        .from('tenant_users')
        .select('role')
        .eq('tenant_id', tenantId)
        .eq('user_id', session.user.id)
        .maybeSingle()
      setAuthed(isValidRole(data?.role))
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
