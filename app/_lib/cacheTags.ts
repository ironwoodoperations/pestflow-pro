/**
 * Shared cache tag generators. MUST be imported by both:
 *   - Next.js read path (unstable_cache options.tags)
 *   - /api/revalidate route handler (revalidateTag call)
 * Drift between the two = silent cache staleness. Always use these
 * functions, never construct tag strings inline.
 */
export const cacheTags = {
  page: (tenantId: string, pageSlug: string) =>
    `tenant:${tenantId}:page:${pageSlug}`,
  allPages: (tenantId: string) =>
    `tenant:${tenantId}:pages`,
  settings: (tenantId: string) =>
    `tenant:${tenantId}:settings`,
} as const;

export type RevalidatePayload =
  | { type: 'page'; tenantId: string; tenantSlug: string; slug: string }
  | { type: 'settings'; tenantId: string; tenantSlug: string };
