// S347 — REAL markdown and metadata, re-fetched from gviewlawnandlandscape.com
// on 2026-09-05 while diagnosing the first live scrape. Not invented: this is
// the exact shape that wrote ten rows to the Grandview prospect, and it is the
// reason the filter checks metadata.statusCode rather than guessing at content.
//
// Trimmed for length where marked; the SIGNALS are verbatim.

export const HOME_MARKDOWN = `Serving Austin & Central Texas

# Austin's most reliable  lawn & landscape crew.

A healthier lawn, a standout yard, and zero hassle — handled by a local team you can count on every single visit. Free quotes in 24 hours.

[Get my free quote](https://gviewlawnandlandscape.com/contact) [512-593-9900](tel:5125939900)

Commercial & Residential

5-Star Rated Locally

Free Quotes in 24h

500+ Local Yards

What you get

## Outcomes,  not just chores.

Every service we offer is built around one goal: a yard you're proud to come home to — without lifting a finger.

### A consistently clean, healthy lawn

Weekly mowing, edging, and seasonal care that keeps your turf thick, green, and crisply manicured all year — no upkeep on your end.

### A standout yard that adds value

Custom landscape design, stonework, and planting that transforms your property into the best-looking one on the block.`

export const HOME_METADATA: Record<string, unknown> = {
  title: 'Grandview Lawn and Landscape Solutions — Austin, TX',
  description: 'Austin lawn care, landscape design, irrigation, stone work, and tree trimming. Free 24-hour quotes from a local, family-owned crew.',
  statusCode: 200,
}

/**
 * THE ONE THAT MATTERS. A real 404 — but Firecrawl's own call succeeded, and
 * the site sets a site-wide og:title, so the old code lifted a plausible title
 * off an error page and saved it under a service slug.
 */
export const NOT_FOUND_MARKDOWN = `# 404

## Page not found

[Go home](https://gviewlawnandlandscape.com/)`

export const NOT_FOUND_METADATA: Record<string, unknown> = {
  title: 'Grandview Lawn and Landscape Solutions — Austin, TX',
  description: 'Commercial and residential lawn care, landscape design, irrigation, and stone work in Austin, TX.',
  statusCode: 404,
  error: 'Not Found',
}

/** A page that genuinely exists, and must survive the filter. */
export const CONTACT_MARKDOWN = `# Contact & Book

Tell us what you need — we'll get back fast.

Call

[512-593-9900](tel:5125939900)

Email

[jb@grandviewls.com](mailto:jb@grandviewls.com)

Service Area

Austin, TX 76571

Name

Phone

Email

Address

ServiceSelect a serviceLawn MaintenanceTree TrimmingFall/Spring CleanupStone WorkLandscape Design & InstallIrrigation RepairArtificial Turf

Notes

Submit Request`

export const CONTACT_METADATA: Record<string, unknown> = {
  title: 'Contact & Book — Grandview Lawn and Landscape Solutions',
  statusCode: 200,
}
