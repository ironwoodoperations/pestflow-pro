// S273 PR #2a — Permission Foundation: the single typed permission map.
//
// This is the ONE source of truth for role→surface→action access, read by BOTH:
//   - the client UX gate (ProtectedRoute admits any valid role; per-surface gating
//     calls can()), AND
//   - the server security gate — the content-table write RLS MIRRORS this matrix
//     (admin/manager edit the content surfaces; user is read-only). RLS is the real
//     boundary; this map is the UX reflection of it. Do NOT scatter `role === 'admin'`
//     checks elsewhere — add a surface here and call can().
//
// Roles are strictly additive: user ⊂ manager ⊂ admin.
//
//   | Surface        | view            | edit            |
//   |----------------|-----------------|-----------------|
//   | analytics      | admin/mgr/user  | (view-only)     |
//   | seo            | admin/mgr/user  | admin/manager   |
//   | social         | admin/mgr/user  | admin/manager   |
//   | blog           | admin/mgr/user  | admin/manager   |
//   | website_team   | admin/mgr/user  | admin/manager   |  (team_members = CONTENT)
//   | site_content   | admin           | admin           |
//   | settings       | admin           | admin           |  (incl. the future Users tab)
//   | billing        | admin           | admin           |
//   | user_mgmt      | admin           | admin           |

export type Role = 'admin' | 'manager' | 'user'
export type Action = 'view' | 'edit'
export type Surface =
  | 'analytics'
  | 'seo'
  | 'social'
  | 'blog'
  | 'website_team'
  | 'site_content'
  | 'settings'
  | 'billing'
  | 'user_mgmt'

const ALL: readonly Role[] = ['admin', 'manager', 'user']
const STAFF: readonly Role[] = ['admin', 'manager']
const ADMIN_ONLY: readonly Role[] = ['admin']
const NONE: readonly Role[] = []

export const PERMISSIONS: Record<Surface, Record<Action, readonly Role[]>> = {
  analytics:    { view: ALL,        edit: NONE },
  seo:          { view: ALL,        edit: STAFF },
  social:       { view: ALL,        edit: STAFF },
  blog:         { view: ALL,        edit: STAFF },
  website_team: { view: ALL,        edit: STAFF },
  site_content: { view: ADMIN_ONLY, edit: ADMIN_ONLY },
  settings:     { view: ADMIN_ONLY, edit: ADMIN_ONLY },
  billing:      { view: ADMIN_ONLY, edit: ADMIN_ONLY },
  user_mgmt:    { view: ADMIN_ONLY, edit: ADMIN_ONLY },
}

/** Surfaces whose EDIT action maps to the content-table write RLS (admin/manager). */
export const CONTENT_EDIT_SURFACES: readonly Surface[] = ['seo', 'social', 'blog', 'website_team']

export const VALID_ROLES: readonly Role[] = ALL

export function isValidRole(role: string | null | undefined): role is Role {
  return role === 'admin' || role === 'manager' || role === 'user'
}

/** Single access predicate. Unknown/absent role → denied. */
export function can(role: Role | string | null | undefined, surface: Surface, action: Action): boolean {
  if (!isValidRole(role)) return false
  return PERMISSIONS[surface][action].includes(role)
}
