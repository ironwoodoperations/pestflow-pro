# S165.9 seo2 — ISR Tag Audit

Date: 2026-04-21

## Architecture note

Admin writes go through the Vite app (`src/components/admin/`). After a successful Supabase write, the admin component calls `triggerRevalidate(payload, accessToken)` which POSTs to `/api/revalidate`. The Next.js route handler calls `revalidateTag(tag)` + `revalidatePath('/tenant/[slug]', 'layout')` to bust the Full Route Cache. JSON-LD is server-rendered in the layout and page files, so the revalidation immediately refreshes the schema in the next request.

Data helpers in `app/tenant/[slug]/_lib/queries.ts` use `React.cache` (per-request deduplication). Route-level `export const revalidate = 300` provides a 5-minute ISR fallback if on-demand revalidation isn't triggered.

## Tag audit

| Source | Table/Key | Feeds Schema | Fetched via | Revalidate call | Status |
|--------|-----------|-------------|-------------|----------------|--------|
| `settings.business_info` | `settings` (key=business_info) | LocalBusiness | `resolveTenantBySlug` + `React.cache` | `BusinessInfoSection` → `triggerRevalidate({ type: 'settings' })` | ✅ WIRED |
| `settings.seo` | `settings` (key=seo) | LocalBusiness (areaServed) + AboutPage | `getSeoSettings` + `React.cache` | `SEOHealthPanel.saveSeoSettings` → `triggerRevalidate({ type: 'settings' })` | ✅ WIRED (fixed T3.2) |
| `settings.social_links` | `settings` (key=social_links) | LocalBusiness (sameAs) | `getSocialLinks` + `React.cache` | `SocialLinksSection` → `triggerRevalidate({ type: 'settings' })` | ✅ WIRED |
| `page_content` (service) | `page_content` | Service schema (name, description) | `getPageContent` + `React.cache` | `ContentTab` → `triggerRevalidate({ type: 'page', slug })` | ✅ WIRED |
| `faqs` | `faqs` | FAQPage | Direct Supabase query in `faq/page.tsx` | `FaqTab` → `triggerRevalidate({ type: 'faq' })` | ✅ WIRED |
| `blog_posts` | `blog_posts` | BlogPosting | `getBlogPost` + `React.cache` | `BlogTab` + `BlogPostEditor` → `triggerRevalidate({ type: 'blog' })` | ✅ WIRED |

## Changes made in T3.2

**SEOHealthPanel.tsx** — `saveSeoSettings()` now calls `triggerRevalidate({ type: 'settings', tenantId }, accessToken)` after the Supabase upsert. Previously, changes to `seo.service_areas`, `seo.meta_description`, `seo.owner_name`, `seo.founded_year` via the Ironwood Ops SEO panel would only propagate on the next 5-minute ISR cycle rather than immediately.

## Summary

All 6 JSON-LD data sources have ISR tag invalidation wired. No additional changes needed beyond the SEOHealthPanel fix above.
