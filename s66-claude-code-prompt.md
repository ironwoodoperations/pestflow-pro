# PestFlow Pro — S66 Claude Code Prompt
_Work on main. Do not generate a context file._

## SESSION RULES
- Read PESTFLOW-SKILL.md at session start
- After every task: `git add . && git commit -m "task[N]: description" && git push`
- All files under 200 lines
- STOP at 50% context window

## ROOT CAUSE CONFIRMED

Login.tsx calls supabase.auth.signInWithPassword() correctly and creates a real
JWT session. Then it calls resolveTenantId() which uses getSlugFromHostname().
On pestflowpro.com (not a subdomain), this returns null. The tenant_users lookup
finds no membership row for tenant_id = null, so it calls supabase.auth.signOut()
— destroying the session. All subsequent edge function calls send "Bearer undefined"
which is why every function returns 401.

---

## TASK 1 — Create dedicated Ironwood login page

Create `src/pages/admin/IronwoodLogin.tsx` (keep under 200 lines):

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const IRONWOOD_ALLOWED = ['admin@pestflowpro.com', 'murphygurl92@gmail.com']

export default function IronwoodLogin() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (!IRONWOOD_ALLOWED.includes(data.user?.email ?? '')) {
      await supabase.auth.signOut()
      setError('Not authorized for Ironwood access.')
      setLoading(false)
      return
    }

    navigate('/ironwood')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a1f2e 100%)' }}
    >
      <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-400 tracking-wide mb-1">
            Ironwood Ops
          </h1>
          <p className="text-gray-400 text-sm">Internal Admin Portal</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            required
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-gray-600 text-xs mt-6">
          PestFlow Pro — Ironwood Operations Group
        </p>
      </div>
    </div>
  )
}
```

Commit: `task[1]: add IronwoodLogin page with direct supabase auth, no tenant check`

---

## TASK 2 — Add /ironwood/login route to App.tsx

Find App.tsx and add the route for IronwoodLogin BEFORE the /ironwood route.
Use React.lazy for the import to match the pattern used by other pages.

```tsx
const IronwoodLogin = React.lazy(() => import('./pages/admin/IronwoodLogin'))

// In the router, add BEFORE the /ironwood route:
<Route path="/ironwood/login" element={<IronwoodLogin />} />
```

Do not change any other routes. Do not change the /ironwood route itself.

Commit: `task[2]: add /ironwood/login route to App.tsx`

---

## TASK 3 — Fix IronwoodOps.tsx redirect to use /ironwood/login

Find the file that contains IronwoodOps (likely src/pages/admin/IronwoodOps.tsx
or src/components/ironwood/IronwoodOps.tsx).

Find the useEffect that checks auth and redirects unauthorized users.
It currently redirects to '/admin/login'. Change it to '/ironwood/login':

```tsx
// Find the line that says navigate('/admin/login') and change to:
navigate('/ironwood/login', { replace: true })
```

Also update the IRONWOOD_ALLOWED list in this file to match:
```tsx
const IRONWOOD_ALLOWED = ['admin@pestflowpro.com', 'murphygurl92@gmail.com']
```

Commit: `task[3]: fix IronwoodOps redirect to /ironwood/login`

---

## TASK 4 — Test

After Vercel deploys:
1. Go to pestflowpro.com/ironwood/login
2. Sign in with admin@pestflowpro.com / pf123demo
3. Confirm you land on /ironwood pipeline page
4. Open Cypress Creek prospect
5. Click Generate Setup Invoice — should return a URL with no 401
6. Click Generate Subscription Link — should open Stripe
7. Click Create Site — should provision successfully

Report results in session summary.

Commit: `task[4]: verified ironwood login and edge function auth working`

---

## DONE CRITERIA
- [ ] /ironwood/login page exists and works
- [ ] Login creates real Supabase JWT session (no signOut called)
- [ ] /ironwood redirects to /ironwood/login when not authenticated
- [ ] Generate Setup Invoice returns 200
- [ ] Generate Subscription Link returns 200
- [ ] Create Site succeeds
- [ ] All pushed to main
