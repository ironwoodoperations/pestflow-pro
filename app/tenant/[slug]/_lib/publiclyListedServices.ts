// S331 — ONE definition of "publicly listed service".
//
// THE DEFECT. Two predicates decided which services a tenant shows, and they disagreed in
// BOTH directions:
//
//   A — getAllServicePages (queries.ts): page_content rows MINUS a fixed 9-slug exclusion
//       list. Shared by nav, home tiles, the sitemap and the quote form.
//   B — serviceSlugsFor ([service]/page.tsx): membership in the vertical's content map.
//       This is what decides render vs notFound().
//
// A row the catalog does not serve is listed by A and 404s under B — a live nav link to a
// 404. That fired in production on 2026-08-26 with a stray artificial-turf row, and dang
// carries a `wasp-control` row today that reproduces it exactly (PEST_CONTENT_MAP has
// `wasp-hornet-control` and not `wasp-control`).
//
// THE FIX IS THE INTERSECTION, and it is already what the architecture says it wants.
// serviceData.ts, on LAWN_SERVICE_SLUGS: "Being in the set makes a slug SERVEABLE, not
// offered: the tile and the nav link come from a page_content row, and a tenant who sells
// three services has three rows." Catalog = serveable. Row = offered. A publicly listed
// service is both, and nothing here invents a rule that was not already stated.
//
// WHAT THIS IS NOT. It does not change the ROUTER. The router answers a different and
// correctly different question — "will this URL render?" — and a catalog slug with no
// page_content row still renders from preset copy. Requiring a row there would 404 pages
// that legitimately serve. One definition of LISTED; the router keeps its definition of
// SERVEABLE, and this module is written against the router's branches so the two cannot
// drift.

import { serviceSlugsFor } from './serviceData';
import { resolveVertical } from '../../../../shared/lib/verticals';
import { CUSTOM_PAGE_SLUGS, NON_SERVICE_SLUGS } from './navConfig';

/** Slugs that are pages but never services. The historical A-side exclusion list, unchanged. */
export const NON_LISTABLE_SLUGS: ReadonlySet<string> = new Set<string>([
  ...NON_SERVICE_SLUGS,
  ...CUSTOM_PAGE_SLUGS,
]);

/** Only the fields the predicate reads. Keeps every caller's row type assignable. */
export interface ListableRow {
  page_slug: string;
}

/** What the predicate needs to know about the tenant. A subset of the resolved Tenant. */
export interface ListableTenant {
  template?: string | null;
  vertical?: string | null;
  industry?: string | null;
}

/**
 * Will the router render a service page at this slug for this tenant?
 *
 * MIRRORS [service]/page.tsx's BRANCH ORDER DELIBERATELY, because agreeing with the router
 * is the entire point of this module:
 *
 *   1. template === 'vita-glow' → that shell's branch runs FIRST, before any vertical
 *      logic, and serves any slug that has a page_content row (`if (!vgContent) notFound()`).
 *      Its catalog IS its rows. Returning true here is not a hole: the caller has already
 *      established the row exists, which is the same test that branch makes.
 *
 *      THIS CASE IS WHY THE PREDICATE IS NOT SIMPLY `catalog.has(slug)`. vita-glow's
 *      `vertical` is NULL, so serviceSlugsFor returns the EMPTY set, and a bare catalog
 *      test would strip all three of its service pages — injectables, iv-infusions,
 *      weight-wellness — from nav, tiles, sitemap and quote form while the router happily
 *      kept rendering them. That is a worse defect than the one being fixed.
 *
 *   2. everything else → membership in the vertical's catalog, exactly as the router's
 *      `activeServiceSlugs.has(params.service)` test does.
 */
export function isServeableServiceSlug(tenant: ListableTenant, slug: string): boolean {
  if (tenant.template === 'vita-glow') return true;
  return serviceSlugsFor(resolveVertical(tenant)).has(slug);
}

/**
 * THE canonical list. Every public listing surface derives from this and nothing else.
 *
 *   publicly listed = not a non-service page
 *                     AND a page_content row exists   (the caller's rows ARE that test)
 *                     AND the router would serve it
 *
 * "PUBLISHABLE" IS NOT PART OF THIS, and that is a finding rather than an omission:
 * `page_content` has NO published/active/status column — id, tenant_id, page_slug, title,
 * subtitle, intro, video_url, video_type, created_at, updated_at, image_url, hero_headline,
 * page_hero_image_url, image_1_url, image_2_url, image_3_url. Read from
 * information_schema, not assumed. A row exists or it does not. A per-page visibility flag
 * is a future need; inventing a column to satisfy a predicate is a migration and is not
 * this session's business.
 *
 * ORDER IS THE CALLER'S. This filters and never sorts, because the surfaces disagree on
 * order for good reasons — the sitemap and quote form sort alphabetically, the home grid
 * follows a configured tile order — and a sort here would silently reorder one of them.
 */
export function publiclyListedServices<T extends ListableRow>(
  tenant: ListableTenant,
  rows: readonly T[] | null | undefined,
): T[] {
  if (!rows) return [];
  return rows.filter(
    (r) => !NON_LISTABLE_SLUGS.has(r.page_slug) && isServeableServiceSlug(tenant, r.page_slug),
  );
}
