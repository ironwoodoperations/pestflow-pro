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
  'retaining-walls': {
    slug: 'retaining-walls',
    displayName: 'Retaining Walls & Hardscape',
    pluralNoun: 'retaining walls',
    blurb: 'A slope that keeps washing out, a wall that is bowing or leaning, a bed or driveway edge that will not stay put — most failed walls in East Texas fail for one reason: they were stacked without drainage behind them, so water builds up and pushes them over.',
    signs: [
      'A slope or bed that keeps washing out',
      'An existing wall bowing, leaning, or cracking',
      'Yard that falls away too fast to use',
      'Driveway or bed edge that will not stay put',
    ],
    treatment: 'We build segmental block and natural stone walls the way they are meant to go in: engineered base, compacted backfill, gravel and perforated drain pipe behind the face, and geogrid tied back into the hill where the height calls for it. Because we are a drainage contractor first, the water is handled before the first course is set, not patched afterward. The wall terraces the ground, opens up usable yard, and stays where we put it. We handle the dirt work around it too — grading, steps, walkways, and bed edging. Serving East Texas since 2017.',
    cta: 'A wall built on drainage holds the grade. Get it done right.',
    metaTitle: 'Retaining Walls & Hardscape | East Texas',
    metaDescription: 'Segmental block and natural stone retaining walls built on proper drainage — engineered base, gravel and drain pipe behind the face, geogrid where the height needs it. Serving East Texas since 2017.',
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
