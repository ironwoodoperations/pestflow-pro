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
  testimonials: (tenantId: string) =>
    `tenant:${tenantId}:testimonials`,
  blog: (tenantId: string) =>
    `tenant:${tenantId}:blog`,
  locations: (tenantId: string) =>
    `tenant:${tenantId}:locations`,
  team: (tenantId: string) =>
    `tenant:${tenantId}:team`,
  faq: (tenantId: string) =>
    `tenant:${tenantId}:faq`,
} as const;

export type RevalidatePayload =
  | { type: 'page'; tenantId: string; tenantSlug: string; slug: string }
  | { type: 'settings'; tenantId: string; tenantSlug: string }
  | { type: 'testimonials'; tenantId: string; tenantSlug: string }
  | { type: 'blog'; tenantId: string; tenantSlug: string }
  | { type: 'locations'; tenantId: string; tenantSlug: string }
  | { type: 'team'; tenantId: string; tenantSlug: string }
  | { type: 'faq'; tenantId: string; tenantSlug: string };
