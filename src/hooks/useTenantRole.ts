import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../context/TenantBootProvider'
import { isValidRole, type Role } from '../lib/permissions'

/**
 * S273 PR #2b — the SINGLE client-side source of the caller's tenant role.
 *
 * This is the exact query ProtectedRoute used to run inline (tenant_users.role keyed to
 * (tenant_id, user_id) off the current session); it is extracted here so ProtectedRoute AND
 * the admin-only Users tab read ONE source — no parallel role fetch, no split-brain (the
 * thing PR #2a closed).
 *
 * The returned role is a UX signal only. It may be as stale as a page load (no realtime) — a
 * demoted admin keeps a cached role until refresh. That is acceptable BY DESIGN: every
 * privileged action is re-authorized server-side (invite-team-member re-reads
 * get_my_tenant_role fresh; content writes are gated by RLS). Never treat this value as a
 * security boundary, and never relax the server check to "fix" the staleness.
 */
export function useTenantRole(): { role: Role | null; loading: boolean } {
  const { id: tenantId } = useTenant()
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        if (active) { setRole(null); setLoading(false) }
        return
      }
      const { data } = await supabase
        .from('tenant_users')
        .select('role')
        .eq('tenant_id', tenantId)
        .eq('user_id', session.user.id)
        .maybeSingle()
      if (!active) return
      setRole(isValidRole(data?.role) ? (data!.role as Role) : null)
      setLoading(false)
    })
    return () => { active = false }
  }, [tenantId])

  return { role, loading }
}
