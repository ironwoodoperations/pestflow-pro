// Irrigation-vertical service catalog (S-PLS-5 / D1). Parallel to
// PEST_CONTENT_MAP — reuses the PestEntry interface (do not fork or rename it)
// so shells consume both verticals through one shape. Copy per Precision
// BUILD-SPEC-v2 §4: `signs` = signs you need this service, `treatment` =
// how the work is actually done (process, not adjectives). Vocabulary rules:
// no equipment/controller brand names, no "lawn", "since 2017" never "10 years".
import type { PestEntry } from './pestContent';

export const IRRIGATION_CONTENT_MAP: Record<string, PestEntry> = {
  'sprinkler-systems': {
    slug: 'sprinkler-systems',
    displayName: 'Sprinkler System Installation & Repair',
    pluralNoun: 'sprinkler systems',
    blurb: 'Dry patches between heads, a water bill that keeps climbing, zones that will not come on — sprinkler problems usually trace to layout, pressure, or worn parts, and patching one head at a time rarely fixes the system.',
    signs: [
      'Dry patches or brown spots between heads',
      'Water bill climbing with no change in use',
      'Heads not popping up or spraying sideways',
      'Zones that will not come on',
    ],
    treatment: 'New installs start with zone layout: we map the property, size each zone to available pressure and flow, and set head spacing for head-to-head coverage — no gaps, no overspray onto pavement. Repairs start with diagnosis: leak isolation zone by zone, head and nozzle replacement, valve and controller troubleshooting, and seasonal tune-ups. Every system we install carries a free 2-year warranty.',
    cta: 'A system that covers evenly costs less to run. Get it laid out right.',
    metaTitle: 'Sprinkler System Installation & Repair | East Texas',
    metaDescription: 'Sprinkler system installation and repair across East Texas — zone layout, head spacing, leak diagnosis, and seasonal tune-ups by a licensed TX irrigator. Free 2-year warranty.',
  },
  'drainage': {
    slug: 'drainage',
    displayName: 'Drainage & Erosion Control',
    pluralNoun: 'drainage systems',
    blurb: 'Water standing in the yard days after rain, soil washing out after storms, water running toward the foundation — drainage problems do not fix themselves, and they get more expensive the longer the water sits.',
    signs: [
      'Water standing in the yard days after rain',
      'Soil washing out after storms',
      'Water running toward the foundation',
      'Soggy ground near downspouts',
    ],
    treatment: 'French drains are built, not buried hose: we trench to grade, lay washed gravel, set sock-wrapped perforated pipe, and backfill so water moves to daylight or a catch basin instead of sitting in the soil. Surface drains and catch basins handle concentrated runoff at downspouts and hardscape; regrading corrects slope so water moves away from the house. Serving East Texas since 2017.',
    cta: 'Standing water has a route out. We build it.',
    metaTitle: 'Drainage & Erosion Control | French Drains | East Texas',
    metaDescription: 'Standing water, washout, and water running toward the foundation — solved with french drains, surface drains, and grading. Serving East Texas since 2017.',
  },
  'pump-systems': {
    slug: 'pump-systems',
    displayName: 'Pump Systems for Lake, Pond & Well',
    pluralNoun: 'pump systems',
    blurb: 'A pump that will not prime, pressure that fades at the far zones, a pump that runs constantly — pump problems come down to sizing, intake, or wear, and an undersized or mis-set pump wastes power on every cycle.',
    signs: [
      'Pump will not prime or loses pressure',
      'Irrigation weak at the far zones',
      'Pump running constantly',
      'Intake clogging with debris',
    ],
    treatment: 'We size the pump to the zones it feeds — head, flow, and run length — so pressure holds at the last head, not just the first. Installation covers intake placement and screening to keep debris out, priming and pressure-switch setup, and wiring done to code. Repairs cover diagnosis, seal and impeller replacement, and re-sizing when the original pump never matched the system. Licensed and insured, BBB A+.',
    cta: 'Reliable pressure at every zone starts with the right pump.',
    metaTitle: 'Lake, Pond & Well Pump Systems | East Texas',
    metaDescription: 'Pump systems for lake, pond, and well irrigation — sizing, installation, and repair for reliable pressure at every zone. Licensed and insured, BBB A+.',
  },
  // S302 — the 'retaining-walls' entry was REMOVED here. Dathan discontinued the
  // service; S300 swapped every slug list to artificial-turf but deliberately
  // left this entry so the live page kept rendering while its replacement copy
  // was pending. /retaining-walls now 301s to / from tenant_redirects, so the
  // page has nothing left to serve.
  //
  // S310 — 'artificial-turf' LANDS BELOW. Its copy is bounded to the scope the
  // owner supplied verbatim: pet turf, golf/putting greens, residential yards;
  // proper drainage and base materials; hardscape mortared edging where a proper
  // install needs it. Nothing beyond that is asserted — no warranty, no free
  // estimate, no turnaround, no pricing, no certifications (S286/S290 precedent),
  // which is why this entry reads shorter than its neighbours. Do not "balance"
  // it by inventing parity claims.
  //
  // The page_content row is NOT created in the same change. IRRIGATION_SERVICE_SLUGS
  // derives from these keys, so a DB row for a slug the map does not serve puts a
  // live tile and nav link in front of customers pointing at a 404 — that fired on
  // this exact slug on 2026-08-26. Code first, row after Vercel reports READY.
  'artificial-turf': {
    slug: 'artificial-turf',
    displayName: 'Artificial Turf',
    pluralNoun: 'artificial turf',
    blurb: 'Pet turf, golf and putting greens, and residential yards. Turf is only as good as what goes under it — the base and the drainage are what decide whether it stays flat and drains, or ripples and holds water.',
    signs: [
      'Pet area that will not drain or stay clean',
      'Want a putting green at home',
      'Yard area where grass will not fill in',
      'Existing turf laid without a proper base',
    ],
    treatment: 'The base comes first: excavate, install and compact base material in lifts, and shape it so water moves instead of pooling. Drainage is built into that base, not added afterward. Turf is then laid to the finished grade, seamed, and secured at the perimeter. Where a proper install calls for it, we set mortared hardscape edging so the edges stay put rather than lifting.',
    cta: 'Base and drainage first — that is what keeps turf flat.',
    metaTitle: 'Artificial Turf | East Texas',
    metaDescription: 'Artificial turf for pet areas, putting greens, and residential yards in East Texas — installed over a compacted base built to drain.',
  },
  'sod-dirt-work': {
    slug: 'sod-dirt-work',
    displayName: 'Sod Installation & Dirt Work',
    pluralNoun: 'sod and dirt work',
    blurb: 'Bare ground after a project, low spots holding water, a yard that will not drain because of grade — sod laid over bad grade fails, so we handle the dirt work first and the sod second.',
    signs: [
      'Bare ground after a project',
      'Yard that will not drain because of grade',
      'Low spots holding water',
      'New construction needing site prep',
    ],
    treatment: 'Dirt work first: we cut and fill to correct slope, compact in lifts so the grade holds, and finish-grade so water sheds away from structures. Low spots are filled and feathered, not topped off. Then sod: soil prep, tight seams, rolled contact, and a watering-in schedule so it roots instead of drying at the edges. Free estimates across East Texas.',
    cta: 'Grade first, grass second — that is why it lasts.',
    metaTitle: 'Sod Installation & Dirt Work | East Texas',
    metaDescription: 'Sod installation and dirt work for East Texas properties — grading, low-spot repair, and site prep that drains the way it should.',
  },
};
