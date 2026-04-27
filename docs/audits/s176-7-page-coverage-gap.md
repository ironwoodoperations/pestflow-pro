# S176.7 — Page Coverage Gap

## Punchline
- Pages in PFP page_content but missing from standalone: **1 page** (`wasp-control`)
- Pages in standalone but missing from PFP: **10 routes** (blog, reviews, service-area, accessibility, 5 hardcoded TX city pages, privacy-policy, terms-of-service)
- Gap size: **TRIVIAL**
- Path D Session 1 impact: **none** — the one missing PFP page (`wasp-control`) is a near-duplicate of `/wasp-hornet-control` which already exists in standalone; standalone extras are all non-service pages PFP never tracked

---

## PFP page_content (18 rows)

| page_slug | exists in standalone? | standalone route | notes |
|---|---|---|---|
| about | yes | `/about` | |
| ant-control | yes | `/ant-control` | |
| bed-bug-control | yes | `/bed-bug-control` | |
| contact | yes | `/contact` | |
| faq | yes | `/faq` | |
| flea-tick-control | yes | `/flea-tick-control` | |
| home | yes | `/` → `Index.tsx` | slug "home" maps to root route |
| mosquito-control | yes | `/mosquito-control` | |
| pest-control | yes | `/pest-control` | |
| quote | yes | `/quote` | |
| roach-control | yes | `/roach-control` | |
| rodent-control | yes | `/rodent-control` | |
| scorpion-control | yes | `/scorpion-control` | |
| spider-control | yes | `/spider-control` | |
| termite-control | yes | `/termite-control` | |
| termite-inspections | yes | `/termite-inspections` | |
| wasp-control | **NO** | — | standalone has `/wasp-hornet-control` only; `wasp-control` is a separate PFP slug with no standalone route |
| wasp-hornet-control | yes | `/wasp-hornet-control` | |

---

## Standalone routes

| route | matches PFP slug? | notes |
|---|---|---|
| `/` | yes → `home` | |
| `/quote` | yes | |
| `/service-area` | no | service area info page — PFP has no page_content equivalent |
| `/reviews` | no | Google reviews page — PFP has no page_content equivalent |
| `/blog` | no | blog list + post view — PFP has `blog_posts` table but no `blog` page_content slug |
| `/blog/:slug` | no | same BlogPage component handles single posts |
| `/faq` | yes | |
| `/contact` | yes | |
| `/accessibility` | no | static legal/utility page — not in PFP |
| `/admin/*` | n/a | redirects to PFP admin; not a content page |
| `/services/:slug` | n/a | legacy redirect — not a content page |
| `/locations/:slug` | n/a | legacy redirect — not a content page |
| `/mosquito-control` | yes | |
| `/spider-control` | yes | |
| `/ant-control` | yes | |
| `/wasp-hornet-control` | yes | |
| `/roach-control` | yes | |
| `/flea-tick-control` | yes | |
| `/rodent-control` | yes | |
| `/termite-control` | yes | |
| `/scorpion-control` | yes | |
| `/bed-bug-control` | yes | |
| `/pest-control` | yes | |
| `/termite-inspections` | yes | |
| `/about` | yes | |
| `/jacksonville-tx` | no | hardcoded location page — PFP stores location data in `location_data` table, not `page_content` |
| `/longview-tx` | no | same — hardcoded location page |
| `/lindale-tx` | no | same |
| `/bullard-tx` | no | same |
| `/whitehouse-tx` | no | same |
| `/privacy-policy` | no | static legal page — not in PFP |
| `/terms-of-service` | no | static legal page — not in PFP |
| `/:slug` | n/a | dynamic fallback → `SlugRouter.tsx`; handles DB-driven location pages (tyler-tx, canton-tx, etc.) |
| `*` | n/a | 404 — not a content page |

---

## Missing from standalone (must port if Path D proceeds)

- **`wasp-control`**: Service page for wasp control (distinct from wasp-hornet-control). PFP updated it on 2026-04-08. The standalone merged this content into `/wasp-hornet-control`. To match PFP exactly, a `/wasp-control` route would need to be added — or PFP's `wasp-control` slug deleted. Low-effort either way; one component or a redirect.

---

## Extra in standalone (no PFP page_content equivalent)

- **`/service-area`**: Static page listing Dang's coverage cities/counties. Hardcoded content in `ServiceArea.tsx`. PFP never tracked this in page_content.
- **`/reviews`**: Google reviews display page (static fallback + live edge-function fetch). No PFP equivalent.
- **`/blog`** + **`/blog/:slug`**: Full blog list and single-post view backed by `blog_posts` table. PFP has a BlogTab in admin but no `blog` page_content slug.
- **`/accessibility`**: Static ADA accessibility statement page.
- **`/jacksonville-tx`**, **`/longview-tx`**, **`/lindale-tx`**, **`/bullard-tx`**, **`/whitehouse-tx`**: Hardcoded city landing pages with full content inline. PFP models location pages via the `location_data` table + `SlugRouter`, not `page_content` — so this is an apples-to-oranges comparison, not a real gap.
- **`/privacy-policy`**, **`/terms-of-service`**: Static legal pages. Not tracked in PFP page_content.

---

## Routing patterns observed
- Routing library: react-router-dom v6.30.1
- Pattern: **flat** — all service routes are top-level slugs (`/ant-control`, `/termite-control`, etc.), not nested under `/services/` or `/pests/`; location pages also flat (`/jacksonville-tx`); dynamic DB locations use `/:slug` catch-before-404
- Implication for porting missing pages: Adding `/wasp-control` to standalone is a 20-line component file + one `<Route>` line in `App.tsx`, or simply a client-side redirect to `/wasp-hornet-control`; no structural changes needed
