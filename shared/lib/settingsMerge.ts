// S330 — the generic settings merge: MERGE, NEVER REPLACE.
//
// THE DEFECT CLASS. S292 found the onboarding wizard writing settings.business_info as a
// WHOLE REPLACEMENT VALUE, destroying FOURTEEN keys it did not know about. Nothing broke
// visibly, so it went unnoticed, and the impact count was reported wrong TWICE because it
// was sampled instead of counted. businessInfoMerge.ts fixed that one write path.
//
// The S324 report then found the SAME SHAPE in provision-tenant, which runs FIRST: its
// eleven-key seed and its `seo` upsert both build a fresh object and upsert it. On a first
// provision that is correct — there is nothing to destroy. On a RE-PROVISION (supported by
// design, and what BundleSocialSetup tells the operator to do) it overwrites whatever the
// owner has since edited in the dashboard.
//
// WHERE THIS LIVES, and why not supabase/functions/_shared/: putting it there would fire
// .github/workflows/redeploy-edge-on-shared-change.yml, republishing the 16 functions named
// in .github/edge-shared-consumers.txt as a side effect of a merge-helper change. shared/lib
// is reachable from BOTH trees — Vite/Next import it extensionlessly, Deno with an explicit
// .ts — so one module serves the wizard path and the edge path, which is the whole point.

/**
 * Values that must NOT overwrite something the owner already has.
 *
 * WHY THIS RULE EXISTS AND WHAT IT IS NOT. A plain `{...existing, ...overlay}` fixes the
 * catastrophic case — keys the overlay never mentions now survive — but it does not fix the
 * quieter one. provision-tenant's seed is written as `wizard.x || body.x || ''`, so on a
 * re-provision every field the operator left blank arrives as `''` and overwrites a real
 * value. That is still destruction, just narrower.
 *
 * So: an EMPTY overlay value never overwrites a NON-EMPTY existing one. A non-empty overlay
 * value always wins — the operator re-ran provisioning with new data and meant it.
 *
 * SCOPE, because getting this wrong is subtle: this rule is for SEED overlays, where an
 * empty value means "the operator left the field blank". It is NOT a clear channel. A
 * caller that deliberately wants to null a key — provision-tenant clearing
 * `integrations.zernio_last_error` on success is the live example — must spread directly
 * rather than route through here, or the clear will be silently dropped.
 *
 * `0` and `false` are NOT empty. They are meaningful settings values (demo_mode.active,
 * seo.noindex, subscription.tier), and treating them as absent is the classic falsy bug this
 * codebase has already paid for in S325.
 */
export function isEmptyOverlayValue(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v === '';
  // An empty ARRAY counts: provision-tenant writes `seo.service_areas: []` as a placeholder
  // it expects a later step to repair, and that placeholder must not wipe a populated list
  // if the later step is skipped or fails.
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Drop overlay entries that would replace real data with nothing.
 *
 * Returned as a NEW overlay rather than applied directly, so it composes: business_info runs
 * this first and then hands the result to mergeBusinessInfo, which owns the separate
 * grouped-key rules (the address quad, lat/lng, hours+timezone). Two rules, each in one
 * place, rather than one function that half-implements both.
 */
export function dropEmptyOverwrites(
  existing: unknown,
  overlay: Record<string, unknown>,
): Record<string, unknown> {
  const base = isPlainObject(existing) ? existing : {};
  const out: Record<string, unknown> = {};
  const keys = Object.keys(overlay);
  for (let i = 0; i < keys.length; i += 1) {
    const k = keys[i];
    const v = overlay[k];
    if (isEmptyOverlayValue(v) && !isEmptyOverlayValue(base[k])) continue;
    out[k] = v;
  }
  return out;
}

/**
 * Merge an overlay into an existing settings value.
 *
 * - Everything in `existing` survives unless the overlay names it with a meaningful value.
 *   No key list, so there is no key list to get wrong — the same reasoning businessInfoMerge
 *   records after the count was wrong twice.
 * - Deleting a key is deliberately NOT expressible. Every caller is writing a subset; a merge
 *   that could also delete would reintroduce the failure mode it exists to prevent.
 * - SHALLOW, by design. It is only correct when the overlay carries whole owned top-level
 *   values, which is exactly the shape of every settings write in provision-tenant. A nested
 *   key that must be preserved needs a targeted write against the sub-object instead, and
 *   `seo.service_areas` at step 9f is the one place that already does that.
 */
export function mergeSettingsValue(
  existing: unknown,
  overlay: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (isPlainObject(existing)) {
    const keys = Object.keys(existing);
    for (let i = 0; i < keys.length; i += 1) out[keys[i]] = existing[keys[i]];
  }
  const kept = dropEmptyOverwrites(existing, overlay);
  const keys = Object.keys(kept);
  for (let i = 0; i < keys.length; i += 1) out[keys[i]] = kept[keys[i]];
  return out;
}

/** The shape every supabase-js single-row read returns. */
export interface SettingsReadResult {
  data: { value: unknown } | null;
  error: { message: string } | null;
}

/**
 * Read the CURRENT value and merge into it, THROWING if the read failed.
 *
 * TWO THINGS THIS ENFORCES, both of which the brief calls out and both of which have already
 * gone wrong in this codebase:
 *
 * 1. THE READ HAPPENS HERE, inside the write path — not from a value captured earlier in the
 *    function. A snapshot taken before the read resolves makes the merge a whole replacement
 *    again, with nothing visibly wrong. That is the S285 ContentTab race and the S292
 *    Onboarding race, twice.
 *
 * 2. A FAILED READ ABORTS rather than degrading to `{}`. A reader that destructures only
 *    `data` returns null on a transient failure or an RLS denial, and merging into null is a
 *    WHOLE REPLACEMENT arrived at silently through the error path. Treating a genuinely
 *    absent row as `{}` is correct — a first provision has none — so only the reader can tell
 *    the two apart, which is why the distinction has to live here.
 */
export async function mergeSettingsRead(
  label: string,
  read: () => Promise<SettingsReadResult>,
  overlay: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { data, error } = await read();
  if (error) {
    throw new Error(
      `${label}: settings read failed, refusing to write (a merge built on a failed read is a whole replacement) — ${error.message}`,
    );
  }
  return mergeSettingsValue(data?.value, overlay);
}
