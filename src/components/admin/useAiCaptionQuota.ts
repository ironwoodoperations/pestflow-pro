import { useState, useCallback } from 'react'

const todayISO = () => new Date().toISOString().split('T')[0]

/**
 * localStorage-based AI caption quota for a tenant.
 * Resets automatically at midnight (checked on every read via date key).
 * limit is always 1 — caller decides whether to enforce based on tier.
 */
export function useAiCaptionQuota(tenantId: string) {
  const dateKey = `pfp_ai_caption_date_${tenantId}`
  const countKey = `pfp_ai_caption_count_${tenantId}`
  const limit = 1

  const readCount = (): number => {
    if (localStorage.getItem(dateKey) !== todayISO()) {
      localStorage.setItem(dateKey, todayISO())
      localStorage.setItem(countKey, '0')
      return 0
    }
    return parseInt(localStorage.getItem(countKey) || '0', 10)
  }

  const [used, setUsed] = useState<number>(() => readCount())

  const increment = useCallback(() => {
    const dKey = `pfp_ai_caption_date_${tenantId}`
    const cKey = `pfp_ai_caption_count_${tenantId}`
    // Re-read to guard against stale closure across day boundary
    const today = todayISO()
    if (localStorage.getItem(dKey) !== today) {
      localStorage.setItem(dKey, today)
      localStorage.setItem(cKey, '1')
      setUsed(1)
    } else {
      const next = parseInt(localStorage.getItem(cKey) || '0', 10) + 1
      localStorage.setItem(cKey, String(next))
      setUsed(next)
    }
  }, [tenantId])

  return { used, limit, canGenerate: used < limit, increment }
}
