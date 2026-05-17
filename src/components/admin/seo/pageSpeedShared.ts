// Shared helpers for the PageSpeed surfaces (SEO Connect card + Reports tile).

// Target URL for a PageSpeed run. Matches the existing useSeoAudit convention:
// VITE_SITE_URL is the tenant's live site (e.g. Dang's standalone domain),
// falling back to Dang's customer site for the demo tenant.
export function pageSpeedTargetUrl(): string {
  return import.meta.env.VITE_SITE_URL || 'https://dangpestcontrol.com'
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return 'never'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return 'unknown'
  const diff = Date.now() - then
  const min = Math.round(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr} hr${hr === 1 ? '' : 's'} ago`
  const day = Math.round(hr / 24)
  return `${day} day${day === 1 ? '' : 's'} ago`
}
