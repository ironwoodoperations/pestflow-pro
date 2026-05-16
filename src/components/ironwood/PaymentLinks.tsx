import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

interface CheckoutSession {
  id: string
  customer_email: string | null
  amount_total: number
  currency: string
  status: string
  payment_status: string
  created: number
  metadata: Record<string, string>
}

type StatusFilter = 'all' | 'complete' | 'open' | 'expired'

const PAGE_SIZE = 25

function fmtAmount(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() })
      .format((cents || 0) / 100)
  } catch {
    return `$${((cents || 0) / 100).toFixed(2)}`
  }
}

function fmtRelative(unixSeconds: number) {
  const diff = Date.now() - unixSeconds * 1000
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const days = Math.floor(hr / 24)
  if (days < 30) return `${days}d ago`
  return new Date(unixSeconds * 1000).toLocaleDateString()
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'complete' ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700'
    : status === 'open'   ? 'bg-amber-900/50 text-amber-300 border-amber-700'
    : status === 'expired'? 'bg-gray-800 text-gray-400 border-gray-700'
    : 'bg-gray-800 text-gray-400 border-gray-700'
  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded border ${cls}`}>
      {status}
    </span>
  )
}

export default function PaymentLinks() {
  const [sessions, setSessions]   = useState<CheckoutSession[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [emailSearch, setEmailSearch]   = useState('')
  const [emailQuery, setEmailQuery]     = useState('')
  const [hasMore, setHasMore]     = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  // Cursor stack: each entry is the starting_after that produced that page.
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null])

  const fetchPage = useCallback(async (startingAfter: string | null) => {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) })
      if (startingAfter) params.set('starting_after', startingAfter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (emailQuery) params.set('customer_email', emailQuery)

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-checkout-sessions?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        },
      )
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to load payment links')
        setSessions([])
        return
      }
      setSessions(data.sessions || [])
      setHasMore(!!data.has_more)
      setNextCursor(data.next_cursor || null)
    } catch (e: any) {
      setError(e.message || 'Network error')
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, emailQuery])

  // Reset to first page whenever filters change.
  useEffect(() => {
    setCursorStack([null])
    fetchPage(null)
  }, [fetchPage])

  const goNext = () => {
    if (!hasMore || !nextCursor) return
    setCursorStack((s) => [...s, nextCursor])
    fetchPage(nextCursor)
  }

  const goPrev = () => {
    if (cursorStack.length < 2) return
    const newStack = cursorStack.slice(0, -1)
    setCursorStack(newStack)
    fetchPage(newStack[newStack.length - 1])
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-white">Payment Links</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Stripe Checkout Sessions across all clients — track setup and subscription payments.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-gray-900 border border-gray-700 text-sm text-gray-200 rounded px-3 py-1.5"
          >
            <option value="all">All</option>
            <option value="complete">Complete</option>
            <option value="open">Open</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Customer email</label>
          <input
            value={emailSearch}
            onChange={(e) => setEmailSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') setEmailQuery(emailSearch.trim()) }}
            placeholder="search email…"
            className="bg-gray-900 border border-gray-700 text-sm text-gray-200 rounded px-3 py-1.5 w-56"
          />
        </div>
        <button
          onClick={() => setEmailQuery(emailSearch.trim())}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded"
        >
          Search
        </button>
      </div>

      {/* Table */}
      <div className="border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Customer Email</th>
              <th className="text-left px-4 py-2 font-medium">Amount</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium">Created</th>
              <th className="text-right px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading…</td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-red-400">{error}</td></tr>
            )}
            {!loading && !error && sessions.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No payment links found.</td></tr>
            )}
            {!loading && !error && sessions.map((s) => (
              <tr key={s.id} className="text-gray-300 hover:bg-gray-900/40">
                <td className="px-4 py-2">{s.customer_email || <span className="text-gray-600">—</span>}</td>
                <td className="px-4 py-2">{fmtAmount(s.amount_total, s.currency)}</td>
                <td className="px-4 py-2"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-2 text-gray-400">{fmtRelative(s.created)}</td>
                <td className="px-4 py-2 text-right">
                  <a
                    href={`https://dashboard.stripe.com/checkout/sessions/${s.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:underline"
                  >
                    View in Stripe →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={goPrev}
          disabled={loading || cursorStack.length < 2}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm rounded disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <span className="text-xs text-gray-500">Page {cursorStack.length}</span>
        <button
          onClick={goNext}
          disabled={loading || !hasMore}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm rounded disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
