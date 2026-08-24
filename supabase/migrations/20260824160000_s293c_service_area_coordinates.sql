-- S293 PR C — coordinates for service-area cities, so a map can mark the towns
-- the tenant actually named.
--
-- WHY MARKERS AND NOT A RADIUS CIRCLE.
--
-- First, a correction to the premise this decision was originally argued from.
-- "service_radius_miles is 0 for every tenant" is not true of the data. There
-- is no such COLUMN at all; the field lives in settings.schema_config, and
-- SEVEN of the nine tenants have a non-zero value stored (dang 50, heartland 50,
-- urban-strike 40, apex 35, pestflow-pro 30, coastal 25, metro 20). The two
-- without one are pls and vita-glow. The "0" came from a hardcoded literal in
-- app/tenant/[slug]/layout.tsx, which passes `service_radius_miles: 0` into the
-- JSON-LD builder — a code default that was read back as though it were data.
-- (The builder never reads the field: areaServed maps the named CITIES.)
--
-- The conclusion survives the correction, and is worth stating on its own terms
-- so that finding those stored numbers later does not reopen it:
--
--   A drawn ring is a coverage COMMITMENT to every point inside it. pls's
--   furthest named city is Longview, 23.3 straight-line miles from Big Sandy; a
--   ring at that distance sweeps in Gladewater, Kilgore, White Oak, Winona,
--   Mineola and most of two counties, none of which are listed. Five towns
--   named, a few dozen asserted. dang's stored 50 would cover a third of East
--   Texas. Those numbers were seeded for an SEO field nothing reads; none was
--   ever vetted as a promise to a visitor reading "they cover my address".
--   Territories have holes, corridors and per-service limits.
--
-- Markers on the named cities render exactly the claim the tenant made: five
-- cities in, five pins out. That is why this design is buildable and the circle
-- is not — not because the radius is missing, but because it is not ours.
--
-- Coordinates are written when a city is SAVED in the admin, never at render
-- time. A render path must not depend on a third-party geocoder. A city that
-- fails to geocode stores NULL and is omitted from the map — never guessed.

-- ── 1. The columns ──────────────────────────────────────────────────────────
--
-- numeric, not float8: these are stored, compared and hashed into a cache
-- revision, and binary float drift would churn the revision for free.
-- Nullable with no default, because "not geocoded yet" and "geocoded to 0,0"
-- must not be the same value. 0,0 is Null Island, in the Gulf of Guinea.
ALTER TABLE public.service_areas
  ADD COLUMN IF NOT EXISTS latitude  numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;

COMMENT ON COLUMN public.service_areas.latitude IS
  'S293C. City centroid (Nominatim). NULL = not geocoded; such a city is omitted from the service-area map rather than guessed.';
COMMENT ON COLUMN public.service_areas.longitude IS
  'S293C. City centroid (Nominatim). NULL = not geocoded; such a city is omitted from the service-area map rather than guessed.';

-- Reject impossible coordinates outright. A geocoder that returns garbage
-- should fail the write, not put a marker in the Southern Ocean. NOT VALID so
-- the existing rows (all NULL today) are not rescanned; NULL passes either way.
ALTER TABLE public.service_areas
  DROP CONSTRAINT IF EXISTS service_areas_coordinates_range;
ALTER TABLE public.service_areas
  ADD CONSTRAINT service_areas_coordinates_range CHECK (
    (latitude  IS NULL OR (latitude  >= -90  AND latitude  <= 90)) AND
    (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
  ) NOT VALID;

-- ── 2. The view, which is the part that is easy to miss ─────────────────────
--
-- The public render path does NOT read service_areas. app/tenant/[slug]/_lib/
-- queries.ts::getAllLocations reads the location_data VIEW, and that view
-- ENUMERATES its columns rather than selecting *. Adding columns to the table
-- alone leaves them invisible to every page that would use them.
--
-- Also restored here: `state`. It has existed on service_areas all along and
-- was never exposed by the view, while ServiceAreaPage carries a
-- `state?: string | null` field and a locationLabel() that formats "City, ST".
-- That branch has never once run on the public site — loc.state is structurally
-- always undefined. One column, and the labels start telling the truth.
--
-- CREATE OR REPLACE VIEW can only APPEND columns, so the twelve existing ones
-- are repeated in their original order, unchanged. Grants survive a replace.
CREATE OR REPLACE VIEW public.location_data AS
  SELECT
    id,
    tenant_id,
    city,
    slug,
    hero_title,
    is_live,
    intro_video_url,
    created_at,
    meta_title,
    meta_description,
    focus_keyword,
    intro,
    -- appended by S293C
    state,
    latitude,
    longitude
  FROM public.service_areas;

COMMENT ON VIEW public.location_data IS
  'Public-facing projection of service_areas. S293C appended state, latitude, longitude. Columns are enumerated, not SELECT * — a new column on service_areas is NOT visible here until this view is replaced.';
