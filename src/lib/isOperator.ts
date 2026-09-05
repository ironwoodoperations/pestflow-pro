// S346C — the ONE frontend operator check.
//
// WHY AN RPC AND NOT A SELECT. The obvious shape is
// `from('operators').select().eq('user_id', session.user.id)` under RLS. That
// would deny EVERYONE, including the operator:
//
//   public.operators has RLS ENABLED and ZERO POLICIES.
//
// Verified against production. With RLS on and no policy, every SELECT from
// `anon` or `authenticated` returns zero rows regardless of the table grant —
// so the gate would bounce Scott out of /ironwood on every load. Writing a
// policy to make it work was explicitly out of scope, and would also be the
// wrong call: a readable operators table is a list of who the operators are.
//
// public.is_operator() is the primitive that already exists for exactly this:
//
//   STABLE SECURITY DEFINER, SET search_path TO '', GRANT EXECUTE to
//   authenticated — SELECT EXISTS (SELECT 1 FROM public.operators
//   WHERE user_id = (SELECT auth.uid()))
//
// SECURITY DEFINER runs as the owner, which bypasses the empty-policy RLS
// (relforcerowsecurity is false), and it returns a BARE BOOLEAN — it answers
// "is the caller an operator" and never ships the list to the browser, which
// is the actual constraint.
//
// S343 and S346 could NOT use this function, because they call from edge
// functions under a service-role client where auth.uid() is NULL and the answer
// would be "no" for everyone. IN THE BROWSER THAT OBJECTION DOES NOT APPLY:
// auth.uid() is the signed-in user. Same function, opposite verdict, because
// the caller is different. Do not "unify" these two call sites.

/** The narrow slice of a Supabase client this needs, so a test can stub it. */
export interface OperatorRpcClient {
  rpc(fn: string): PromiseLike<{ data: unknown; error: unknown }>
}

/**
 * True when the signed-in user is an Ironwood operator.
 *
 * FAILS CLOSED. `error` is checked BEFORE `data` is read, and `data` is
 * deliberately not trusted when `error` is set — otherwise a driver that
 * returned both could authorize a caller off a failed query. A test supplies
 * exactly that pair (a `true` alongside an error), so this branch is
 * load-bearing rather than defensive decoration; do not "simplify" it away.
 *
 * Only `true` authorizes. Anything else — false, null, undefined, a string, a
 * network failure — denies.
 */
export async function isOperator(client: OperatorRpcClient): Promise<boolean> {
  try {
    const { data, error } = await client.rpc('is_operator')
    if (error) {
      const message = (error as { message?: string })?.message ?? String(error)
      console.warn('[isOperator] is_operator() failed — DENYING:', message)
      return false
    }
    return data === true
  } catch (err) {
    console.warn('[isOperator] is_operator() threw — DENYING:', err)
    return false
  }
}
