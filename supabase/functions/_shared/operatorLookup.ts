// S346 — ONE operator identity, read from public.operators.
//
// WHY THIS FILE EXISTS AT ALL, rather than a Set in aiAuth.ts:
// S308 created public.operators and public.is_operator() to REPLACE hardcoded
// operator checks. S343 converted ironwood-provision to read the table. The
// aiAuth allowlist was missed, so the two drifted into being EXACT OPPOSITES —
// the Set held only admin@pestflowpro.com, the table only scott@homeflowpro.ai.
// Whichever identity the operator signed in as, something 403'd. It did:
// scrape-prospect returned Forbidden twice and Firecrawl was never called.
// Adding the second uuid to the Set would have made a FOURTH hardcoded list and
// moved the problem. The table is the source of truth; this is the only reader.
//
// WHY NOT public.is_operator(): it resolves the caller as auth.uid(), which is
// NULL under a service-role client — so calling it as an RPC from an edge
// function would deny EVERYONE, a failure that looks exactly like working code.
// S343 hit this and read the table directly instead. Same choice here.
//
// WHY IT LIVES OUTSIDE aiAuth.ts: aiAuth.ts imports createClient from esm.sh,
// so vitest cannot load it and nothing in it can be unit-tested. This module
// imports nothing, takes the client as a parameter, and is therefore testable.

/**
 * The narrow slice of a Supabase client this lookup needs. Structural, so a
 * test can pass a stub without constructing a real client (which would drag
 * esm.sh back in and make this module untestable again).
 */
export interface OperatorLookupClient {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): Promise<{ data: unknown; error: unknown }>
      }
    }
  }
}

/**
 * True when `userId` is an Ironwood operator.
 *
 * `userId` MUST be the verified JWT subject — the `user.id` returned by
 * `auth.getUser(token)` — and never a caller-supplied value from a request body.
 *
 * FAILS CLOSED. A lookup error denies. Note the order: `error` is checked BEFORE
 * `data` is read, and `data` is deliberately not trusted when `error` is set —
 * a driver that returned both would otherwise be able to authorize a caller off
 * a failed query. A test supplies exactly that pair, so this branch is
 * load-bearing rather than defensive decoration; do not "simplify" it away.
 */
export async function isIronwoodOperator(
  svc: OperatorLookupClient,
  userId: string,
): Promise<boolean> {
  if (!userId) return false

  const { data, error } = await svc
    .from('operators')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    const message = (error as { message?: string })?.message ?? String(error)
    console.warn('[operatorLookup] operators lookup failed — DENYING:', message)
    return false
  }

  return data !== null && data !== undefined
}
