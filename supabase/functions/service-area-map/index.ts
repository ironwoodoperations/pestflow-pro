// S293 PR C — geocode the tenant's service-area cities and regenerate their map.
//
// Runs on SAVE, never on render. A page must not depend on a third-party
// geocoder being up, and an image must not be re-fetched on ISR's 300s timer:
// coordinates change on the order of months, so the work happens when a city is
// added, removed or renamed, and the result is stored.
//
// It writes two things:
//   1. service_areas.latitude / longitude for any live city missing them
//   2. settings.service_area_map = { url, revision, width, height }
//
// The revision is the render path's staleness check. Until it matches the live
// city set, the page renders NO MAP rather than a wrong one.
//
// SECRETS. GOOGLE_MAPS_STATIC_KEY and GOOGLE_MAPS_SIGNING_SECRET live in Edge
// Function Secrets and never leave this process: the signed Google URL is
// fetched HERE and only the resulting PNG, on our own public bucket, is ever
// named in HTML. This is why there is no browser key to referrer-restrict —
// tenants live on wildcard *.pestflowpro.ai and on arbitrary custom domains,
// and a referrer allowlist cannot name a domain that does not exist yet.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  mappableAreas, buildStaticMapPath, serviceAreaRevision, MAP_DEFAULTS,
  type ServiceAreaRow,
} from '../../../shared/lib/serviceAreaMap.ts'
import { signStaticMapUrl } from '../../../shared/lib/signStaticMapUrl.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const BUCKET = 'tenant-assets'
const NOMINATIM = 'https://nominatim.openstreetmap.org/search'

/** Nominatim asks for a real User-Agent and at most one request per second. */
const UA = 'PestFlowPro/1.0 (service-area map; admin@pestflowpro.com)'
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface GeocodeResult { latitude: number; longitude: number }

/**
 * City centroid, or null. NEVER a guess: a miss stores NULL and the city is
 * omitted from the map. Centroid accuracy is all a marker needs.
 */
async function geocodeCity(city: string, state: string | null): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({ format: 'jsonv2', limit: '1', city })
  // Without a state, "Arp" is ambiguous worldwide. Nine of dang's eighteen
  // cities have no state recorded; country alone is the most we can honestly
  // constrain, and a wrong-country hit is filtered by the caller's sanity check.
  if (state) params.set('state', state)
  params.set('country', 'United States')

  const res = await fetch(`${NOMINATIM}?${params}`, { headers: { 'User-Agent': UA, 'Accept-Language': 'en' } })
  if (!res.ok) return null
  const rows = await res.json().catch(() => null)
  if (!Array.isArray(rows) || rows.length === 0) return null
  const lat = Number(rows[0]?.lat)
  const lon = Number(rows[0]?.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  if (lat === 0 && lon === 0) return null
  return { latitude: lat, longitude: lon }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { tenant_id: tenantId } = await req.json()
    if (!tenantId || typeof tenantId !== 'string') {
      return json({ error: 'tenant_id required' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: areas, error: readErr } = await supabase
      .from('service_areas')
      .select('id, city, slug, state, is_live, latitude, longitude')
      .eq('tenant_id', tenantId)
      .eq('is_live', true)
      .order('city')
    // THROW on a read failure rather than proceeding. S292's lesson: a reader
    // that returns empty on error looks exactly like a tenant with no cities,
    // and would clear a perfectly good map.
    if (readErr) return json({ error: `read failed: ${readErr.message}` }, 500)

    const rows = (areas ?? []) as Array<ServiceAreaRow & { id: string }>

    // ── 1. Geocode what is missing, one per second ──────────────────────────
    let geocoded = 0
    const failures: string[] = []
    for (const row of rows) {
      if (row.latitude != null && row.longitude != null) continue
      const hit = await geocodeCity(row.city, row.state ?? null)
      if (hit) {
        const { error } = await supabase.from('service_areas')
          .update({ latitude: hit.latitude, longitude: hit.longitude })
          .eq('id', row.id).eq('tenant_id', tenantId)
        if (error) { failures.push(`${row.city}: ${error.message}`) } else {
          row.latitude = hit.latitude
          row.longitude = hit.longitude
          geocoded++
        }
      } else {
        failures.push(`${row.city}: no geocoder match`)
      }
      await sleep(1100) // Nominatim: 1 req/sec, with headroom.
    }

    // ── 2. Rebuild the image if there is anything to draw ───────────────────
    const cities = mappableAreas(rows)
    if (cities.length === 0) {
      // No coordinates at all. Remove the pointer so the page renders NOTHING
      // rather than keeping a map of cities that are no longer live.
      await supabase.from('settings').delete().eq('tenant_id', tenantId).eq('key', 'service_area_map')
      return json({ ok: true, cities: 0, geocoded, failures, map: null })
    }

    const revision = serviceAreaRevision(cities)

    const { data: existing } = await supabase.from('settings').select('value')
      .eq('tenant_id', tenantId).eq('key', 'service_area_map').maybeSingle()
    const current = (existing?.value ?? {}) as { revision?: string; url?: string }
    if (current.revision === revision && current.url) {
      return json({ ok: true, cities: cities.length, geocoded, failures, map: current, unchanged: true })
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_STATIC_KEY') ?? ''
    const secret = Deno.env.get('GOOGLE_MAPS_SIGNING_SECRET') ?? ''
    if (!apiKey || !secret) return json({ error: 'maps credentials not configured' }, 500)

    const signed = await signStaticMapUrl(buildStaticMapPath(cities), apiKey, secret)
    const imageRes = await fetch(signed)
    if (!imageRes.ok) {
      // Do NOT write a pointer to a failed fetch. The page keeps rendering
      // nothing, which is correct, and the next save retries.
      return json({ error: `static maps ${imageRes.status}` }, 502)
    }
    const bytes = new Uint8Array(await imageRes.arrayBuffer())

    // Revision in the path: the object is immutable, so a changed city set is a
    // NEW object rather than an overwrite, and the CDN never serves a stale one.
    const path = `service-area-maps/${tenantId}/${revision}.png`
    const { error: upErr } = await supabase.storage.from(BUCKET)
      .upload(path, bytes, { contentType: 'image/png', cacheControl: '31536000', upsert: true })
    if (upErr) return json({ error: `upload failed: ${upErr.message}` }, 500)

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
    const value = {
      url: pub.publicUrl,
      revision,
      width: MAP_DEFAULTS.width * MAP_DEFAULTS.scale,
      height: MAP_DEFAULTS.height * MAP_DEFAULTS.scale,
    }

    const { error: writeErr } = await supabase.from('settings')
      .upsert({ tenant_id: tenantId, key: 'service_area_map', value }, { onConflict: 'tenant_id,key' })
    if (writeErr) return json({ error: `settings write failed: ${writeErr.message}` }, 500)

    return json({ ok: true, cities: cities.length, geocoded, failures, map: value })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'unknown error' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
