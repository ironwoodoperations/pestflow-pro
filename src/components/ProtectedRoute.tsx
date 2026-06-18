import { Navigate } from 'react-router-dom'
import { useTenantRole } from '../hooks/useTenantRole'
import { isValidRole } from '../lib/permissions'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // S273 PR #2a/#2b — the route is the MEMBERSHIP gate: admit ANY valid tenant role
  // (admin/manager/user). Per-surface access is decided by the permission map
  // (src/lib/permissions.ts) and enforced server-side by content-table RLS. Role is read
  // through useTenantRole() — the single client role source shared with the Users tab, so
  // there is no parallel fetch (the split-brain PR #2a closed).
  const { role, loading } = useTenantRole()

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!isValidRole(role)) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}
