// Lawn-vertical service catalog (S323 PR A). Parallel to PEST_CONTENT_MAP and
// IRRIGATION_CONTENT_MAP — reuses the PestEntry interface (do not fork or
// rename it) so shells consume every vertical through one shape.
//
// THIS IS A CATALOG, NOT A CLAIM. Every service the lawn trade might offer sits
// here and is always routable. Nothing is asserted about any tenant by its
// presence: a service reaches a customer's site only when a page_content row
// exists for it, which is already how tiles and nav work. The separation is the
// point — the map makes a slug SERVEABLE, the row makes it OFFERED.
//
// It also closes a live defect class. Until now an admin could create a
// page_content row for a slug the content map does not serve, putting a live
// tile and nav link in front of customers pointing at a 404. That fired on
// 2026-08-26 with a stray artificial-turf row. With the full catalog in the map,
// adding a service later is just a row and the route already exists.
//
// WHAT MAY LIVE HERE (read before adding a string): only what is true of the
// whole TRADE. No warranty term, no licence number, no region, no rating, no
// response time, no offer, no years in business. Those are TENANT facts and
// live in settings, supplied by the owner. The irrigation map still carries
// three of them ('free 2-year warranty', 'since 2017', 'BBB A+', 'East Texas')
// and that is the mistake this file is written not to repeat. Locked by tests
// in src/lib/__tests__/lawnCatalog.test.ts.
//
// SLUG REUSE (S323). Three slugs here are DELIBERATELY shared with another
// vertical's catalog rather than forked into a parallel URL:
//
//   artificial-turf     also in IRRIGATION_CONTENT_MAP — the same service.
//   mosquito-control    also in PEST_CONTENT_MAP       — the same service.
//   sprinkler-systems   also in IRRIGATION_CONTENT_MAP. The brief proposed a
//                       new `irrigation-repair` slug for the lawn side; it is
//                       NOT used. Two slugs for one service means two URLs and
//                       a 404 the moment a tenant's vertical changes, which is
//                       exactly the defect above. The scope difference the new
//                       slug was meant to carry (lawn crews repair, they do not
//                       design and install) is carried by the COPY instead: the
//                       entry below is repair-scoped and claims no installation.
//                       Per-vertical maps make that possible at no cost.
//
// Overlap is intentional and approved, not a modelling error — selection at
// provisioning (PR B) is what prevents collision. The tests assert the overlap
// set EXACTLY, so a fourth shared slug appearing by accident fails.
import type { PestEntry } from './pestContent';

export const LAWN_CONTENT_MAP: Record<string, PestEntry> = {
  // ── Turf treatment ────────────────────────────────────────────────────────
  'lawn-fertilization': {
    slug: 'lawn-fertilization',
    displayName: 'Lawn Fertilization',
    pluralNoun: 'lawn fertilization',
    blurb: 'Turf pulls nutrients out of the soil every time it grows and every time it is cut. Feeding puts them back on a schedule the grass can actually use, which is what separates a lawn that thickens through the season from one that thins out.',
    signs: [
      'Pale or yellowing colour through the growing season',
      'Thin turf that weeds are moving into',
      'Growth that stalls after the first few mowings',
      'Colour that fades between rains',
    ],
    treatment: 'Feeding is scheduled to the grass type and the season rather than applied on a fixed calendar. Rates are set from what the turf is doing and what a soil test shows, and split across the year so nitrogen is released as the grass can take it up instead of all at once. Applications are watered in and timed around mowing so the product reaches the soil rather than sitting on the blades.',
    cta: 'Turf grows on what the soil can give it. Feeding is how you keep that up.',
    metaTitle: 'Lawn Fertilization',
    metaDescription: 'Seasonal lawn fertilization scheduled to grass type and growing season, at rates set from soil conditions rather than a fixed calendar.',
  },
  'weed-control': {
    slug: 'weed-control',
    displayName: 'Weed Control',
    pluralNoun: 'weed control',
    blurb: 'Weeds are opportunists — they take the space thin turf leaves open. Treatment handles what is growing now; timing and turf density are what stop the next generation filling in behind it.',
    signs: [
      'Broadleaf weeds spreading through open turf',
      'Crabgrass and other grassy weeds through summer',
      'Weeds back within weeks of being pulled',
      'Thin areas filling with anything but grass',
    ],
    treatment: 'Broadleaf and grassy weeds are treated differently, so the first step is identifying what is actually growing. Pre-emergent goes down before soil temperatures bring the season’s seed up; post-emergent handles what is already established, selected so it takes the weed and not the turf. Applications are timed to the growing season and held to what the label allows for the grass type.',
    cta: 'Weeds take the space turf leaves open. Timing is most of the work.',
    metaTitle: 'Weed Control',
    metaDescription: 'Targeted treatment of broadleaf and grassy weeds, with pre-emergent and post-emergent applications timed to the growing season and the grass type.',
  },
  'lawn-aeration': {
    slug: 'lawn-aeration',
    displayName: 'Lawn Aeration',
    pluralNoun: 'lawn aeration',
    blurb: 'Soil compacts under foot traffic, mowers and rain. Compacted ground holds water, air and fertilizer at the surface where roots cannot reach them, and no amount of feeding fixes a lawn the water never gets into.',
    signs: [
      'Water pooling or running off instead of soaking in',
      'Ground hard enough to resist a screwdriver',
      'Thin turf along paths and play areas',
      'A thatch layer building above the soil',
    ],
    treatment: 'Core aeration pulls plugs of soil and thatch out of the lawn rather than punching holes that press the compaction sideways. Plugs are left to break down on the surface, returning soil and microbes to the thatch layer. Timing is set to the growing season for the grass type so the holes close with new root growth, and it is commonly paired with overseeding while the openings are there.',
    cta: 'Water and air have to reach the roots. Aeration opens the way.',
    metaTitle: 'Lawn Aeration',
    metaDescription: 'Core aeration that relieves compacted soil so water, air and nutrients reach the roots, timed to the growing season for the grass type.',
  },
  'overseeding': {
    slug: 'overseeding',
    displayName: 'Overseeding',
    pluralNoun: 'overseeding',
    blurb: 'Thin turf does not thicken on its own — mature grass spreads slowly, and weeds reach open ground first. Overseeding puts new plants into the stand while the existing lawn is still holding the soil.',
    signs: [
      'Thin areas that never fill back in',
      'Bare spots left by traffic, pets or disease',
      'A patchy stand coming out of summer',
      'Weeds establishing in open ground',
    ],
    treatment: 'Seed is matched to the existing grass type and to the light the area actually gets. Contact between seed and soil is what decides germination, so overseeding follows aeration or a raked opening rather than being broadcast onto thatch. Rates are set for the density already present, and a watering schedule follows to carry the seedlings through establishment.',
    cta: 'Thin turf fills with weeds or with grass. Seed decides which.',
    metaTitle: 'Overseeding',
    metaDescription: 'New seed worked into existing turf to thicken thin areas and fill bare spots, matched to the grass type and the light the area gets.',
  },
  'grub-control': {
    slug: 'grub-control',
    displayName: 'Grub & Insect Control',
    pluralNoun: 'grubs and turf insects',
    blurb: 'Not every brown patch is drought. Grubs feed on roots below the surface and chinch bugs feed on the crowns above it, and both leave areas that lift loose or brown in place while the rest of the lawn is fine.',
    signs: [
      'Turf that lifts away like a loose mat',
      'Irregular brown patches that do not respond to water',
      'Birds or animals digging up the lawn',
      'Grass thinning along hot edges near pavement',
    ],
    treatment: 'The insect is identified first — grubs, chinch bugs and sod webworms damage turf differently and are treated at different points in their cycle. Preventive applications target the window when eggs hatch and the larvae are small; curative treatment handles a population already feeding. Product and rate are chosen for the species and watered in to the depth the insect occupies.',
    cta: 'Damage below the surface looks like drought. Identify it before you water it.',
    metaTitle: 'Grub & Insect Control',
    metaDescription: 'Treatment for grubs, chinch bugs and other insects that feed on turf and roots, timed to the point in the cycle the species is at.',
  },
  'lawn-disease-control': {
    slug: 'lawn-disease-control',
    displayName: 'Lawn Disease Control',
    pluralNoun: 'lawn diseases',
    blurb: 'Turf disease is a fungus that was already present, waiting on the conditions that let it run — heat, moisture sitting on the leaf, and a stand under stress. The pattern in the grass is what tells you which one it is.',
    signs: [
      'Circular brown or straw-coloured patches',
      'Spots or lesions on individual blades',
      'Damage spreading after warm, humid nights',
      'Thinning where water sits longest',
    ],
    treatment: 'Diagnosis comes first: brown patch, dollar spot and large patch look alike from a distance and call for different handling. The conditions driving the outbreak are corrected where they can be — watering time, mowing height, thatch and airflow — because a fungicide applied over the cause buys weeks rather than a season. Treatment is then selected for the organism and applied at the interval the disease pressure calls for.',
    cta: 'The pattern names the disease. Treatment follows the diagnosis.',
    metaTitle: 'Lawn Disease Control',
    metaDescription: 'Identification and treatment of fungal turf diseases such as brown patch and dollar spot, with the conditions driving them corrected alongside.',
  },
  'soil-health': {
    slug: 'soil-health',
    displayName: 'Soil Health & pH',
    pluralNoun: 'soil health',
    blurb: 'Turf can only take up what the soil will release, and pH decides how much of that is available. A lawn fed correctly on soil at the wrong pH is still a lawn that is not being fed.',
    signs: [
      'Fertilizer applied with little visible response',
      'Moss or weeds that favour acid soil',
      'Ground that crusts, cracks or stays hard',
      'Colour that will not hold through the season',
    ],
    treatment: 'A soil test comes first — pH, organic matter and the major nutrients — because everything after it is guesswork without one. Lime or sulphur is applied at the rate the test calls for to move pH toward the range the grass type needs, and organic matter or a soil conditioner is worked in where structure is the limit. The changes are gradual by nature, so results are read against a follow-up test rather than by eye.',
    cta: 'Feeding works when the soil can release it. Start with a test.',
    metaTitle: 'Soil Health & pH',
    metaDescription: 'Soil testing and amendment to correct pH and improve what the turf grows in, with results read against a follow-up test.',
  },

  // ── Maintenance ───────────────────────────────────────────────────────────
  'mowing-maintenance': {
    slug: 'mowing-maintenance',
    displayName: 'Mowing & Edging',
    pluralNoun: 'mowing and edging',
    blurb: 'Mowing is the most frequent thing done to a lawn, and cut height and blade sharpness affect the turf more than most treatments do. Running a property on a route is what keeps the height, the pattern and the interval consistent.',
    signs: [
      'Grass cut short and browning at the tips',
      'Ragged, torn blade ends after mowing',
      'Clippings clumping and smothering the turf',
      'Beds and walks losing their edge',
    ],
    treatment: 'Mowing runs on a set interval so no more than about a third of the blade comes off in a cut, with height set for the grass type and raised through summer stress. Patterns are alternated so wheels do not rut the same lines, and blades are kept sharp because a torn leaf loses more water and opens the plant to disease. Edging along walks, drives and beds and blowing hard surfaces clean finish the visit.',
    cta: 'Cut height and interval do more for turf than anything else on the schedule.',
    metaTitle: 'Mowing & Edging',
    metaDescription: 'Scheduled mowing, edging and blowing on a regular service route, with cut height set for the grass type and the season.',
  },
  'seasonal-cleanup': {
    slug: 'seasonal-cleanup',
    displayName: 'Seasonal Cleanup',
    pluralNoun: 'seasonal cleanups',
    blurb: 'Leaves left on turf mat down and hold moisture against the crowns; beds left uncut push new growth up through last year’s material. Both cleanups exist to get the property back to a clean starting point.',
    signs: [
      'Leaf cover matting down over the lawn',
      'Beds full of spent growth and debris',
      'Perennials and ornamental grasses needing cutting back',
      'Mulch thin or displaced after winter',
    ],
    treatment: 'Fall clears leaf cover off turf and beds before it mats, cuts back what should not overwinter standing, and leaves the lawn able to breathe. Spring cuts back ornamental grasses and perennials, clears what winter left, and re-edges and re-dresses beds ahead of the growing season. Material is hauled off rather than piled where it will smother planting.',
    cta: 'Both ends of the season need a clean start. That is what a cleanup is.',
    metaTitle: 'Seasonal Cleanup',
    metaDescription: 'Leaf removal, bed cleanup and seasonal preparation in spring and fall, with material hauled off rather than piled on the property.',
  },
  'tree-shrub-trimming': {
    slug: 'tree-shrub-trimming',
    displayName: 'Tree & Shrub Trimming',
    pluralNoun: 'tree and shrub trimming',
    blurb: 'Shrubs and small trees put on growth every year whether or not there is room for it. Pruning decides the shape and, just as much, whether the plant keeps the buds it will flower from next season.',
    signs: [
      'Shrubs grown into walls, walks or windows',
      'Crossing or rubbing branches',
      'Dead or broken wood in the canopy',
      'Flowering shrubs blooming less each year',
    ],
    treatment: 'Timing is set by the plant: spring bloomers are pruned after they flower so next year’s buds are not cut off, and most others are shaped while dormant. Dead, damaged and crossing wood comes out first, then the plant is shaped to its natural habit rather than sheared into one. Cuts are made at the collar or a node so the wound closes, and clearance is held off structures, walks and drives.',
    cta: 'Prune to the plant’s calendar, not the schedule’s.',
    metaTitle: 'Tree & Shrub Trimming',
    metaDescription: 'Pruning and shaping of trees and shrubs to keep growth healthy and controlled, timed to when each plant sets its buds.',
  },
  'mulch-bed-maintenance': {
    slug: 'mulch-bed-maintenance',
    displayName: 'Mulch & Bed Maintenance',
    pluralNoun: 'mulch and bed maintenance',
    blurb: 'Mulch holds moisture in a bed, moderates soil temperature and keeps most weed seed from reaching light. It also breaks down, which is why beds need re-dressing rather than one installation.',
    signs: [
      'Mulch thinned, faded or washed out of the bed',
      'Weeds coming up through the bed surface',
      'Bed lines lost into the lawn',
      'Soil crusting or drying quickly around plantings',
    ],
    treatment: 'Beds are weeded and the edge is re-cut to a defined line that holds mulch in and turf out. Mulch is applied to a depth that suppresses weed seed without piling against stems or trunks, because material heaped on a trunk holds moisture where the plant cannot handle it. Existing mulch is turned or topped rather than layered indefinitely, so the bed does not build up above grade.',
    cta: 'A defined edge and the right depth are what make mulch work.',
    metaTitle: 'Mulch & Bed Maintenance',
    metaDescription: 'Mulch installation, bed edging and upkeep of planted areas, applied to a depth that suppresses weed seed without burying stems.',
  },

  // ── Landscape ─────────────────────────────────────────────────────────────
  'landscape-design': {
    slug: 'landscape-design',
    displayName: 'Landscape Design & Installation',
    pluralNoun: 'landscape design and installation',
    blurb: 'A planting plan has to work with what the site already does — where the water goes, where the sun falls, and how the space is used. Plants chosen for a photograph rather than for the site are the ones replaced in two years.',
    signs: [
      'Bare ground or turf where a planted space is wanted',
      'Plants that keep failing in the same spot',
      'Beds outgrown by what was planted in them',
      'An outdoor area with no defined use',
    ],
    treatment: 'Design starts on site: sun and shade through the day, drainage and grade, soil, and how the space needs to function. Plants are selected for mature size and for the conditions of the spot they go in, so the bed still works once they fill. Installation covers bed preparation and soil amendment, planting at correct depth, mulching, and the watering plan the plants need through establishment.',
    cta: 'Plant to the site, and the bed still works in five years.',
    metaTitle: 'Landscape Design & Installation',
    metaDescription: 'Design and installation of plantings, beds and outdoor living areas, with plants selected for mature size and the conditions of the site.',
  },
  'hardscape-stonework': {
    slug: 'hardscape-stonework',
    displayName: 'Hardscape & Stonework',
    pluralNoun: 'hardscape and stonework',
    blurb: 'Patios, walks and walls stay flat and stay standing because of what is under and behind them. Base depth, compaction and drainage are what decide whether stonework settles in a season or holds for decades.',
    signs: [
      'Pavers settling, rocking or lifting',
      'Walls leaning, bulging or shedding stone',
      'Walks washing out or holding water',
      'A grade change with no retaining structure',
    ],
    treatment: 'Excavation goes to the depth the use calls for, and base material is placed and compacted in lifts rather than in one pass. Patios and walks are set to a drainage slope so water leaves the surface, with edge restraint to keep the field tight. Retaining walls are built on a compacted base with drainage stone and pipe behind the face, so water has somewhere to go instead of pushing on the wall.',
    cta: 'What holds stonework flat is under it, not on it.',
    metaTitle: 'Hardscape & Stonework',
    metaDescription: 'Patios, walkways, retaining walls and decorative stone borders, built on a compacted base with drainage designed in behind the face.',
  },

  // ── Boundary services ─────────────────────────────────────────────────────
  // These slugs appear in MORE THAN ONE vertical's catalog, deliberately. See
  // the SLUG REUSE note at the head of this file; the overlap set is asserted
  // exactly by the tests, so a fourth shared slug cannot arrive unnoticed.
  //
  // 'sprinkler-systems' is the irrigation vertical's slug, REUSED rather than
  // forked into 'irrigation-repair'. The copy below is repair-scoped and claims
  // no design or installation — the scope difference lives in the copy, not in
  // a second URL for the same service.
  'sprinkler-systems': {
    slug: 'sprinkler-systems',
    displayName: 'Irrigation Repair',
    pluralNoun: 'irrigation repair',
    blurb: 'Watering problems show up in the turf before they show up on the bill — dry arcs between heads, a soft spot that never dries, a zone that stopped coming on. Most of it traces to heads, valves or the controller rather than to the pipe.',
    signs: [
      'Dry arcs or brown spots between heads',
      'Heads not popping up, or spraying sideways',
      'A zone that will not come on, or will not shut off',
      'A soft, wet spot that stays wet between cycles',
    ],
    treatment: 'Diagnosis runs zone by zone with the system on: coverage checked head to head, heads and nozzles matched and adjusted for arc and radius, and leaks isolated to the head, the fitting or the lateral. Valves are tested for solenoid and diaphragm failure, and controller programming and wiring are checked against what each zone actually needs. Seasonal startup and shutdown are handled the same way.',
    cta: 'A dry spot is a coverage problem. Find it at the head, not on the bill.',
    metaTitle: 'Irrigation Repair',
    metaDescription: 'Diagnosis and repair of sprinkler systems — head and nozzle adjustment, leak isolation, valve testing and controller programming, zone by zone.',
  },
  'artificial-turf': {
    slug: 'artificial-turf',
    displayName: 'Artificial Turf',
    pluralNoun: 'artificial turf',
    blurb: 'Synthetic turf holds up where grass will not — deep shade, pet areas, hard traffic. What decides whether it stays flat and drains is the base under it, not the turf itself.',
    signs: [
      'An area where grass will not fill in',
      'A pet area that stays muddy or will not drain',
      'Shade or traffic that turf cannot recover from',
      'A putting green wanted in the yard',
    ],
    treatment: 'The area is excavated and base material is placed and compacted in lifts, shaped so water moves to an outlet instead of pooling — drainage is built into the base rather than added afterward. Turf is laid to the finished grade, seamed, infilled for the use it will take, and secured at the perimeter so the edges stay down. Pet areas take an infill and a base built to drain and to rinse.',
    cta: 'Turf is only as flat as the base under it.',
    metaTitle: 'Artificial Turf',
    metaDescription: 'Synthetic turf for lawns, pet areas and putting greens, installed over a compacted base built to drain.',
  },
  'perimeter-pest-control': {
    slug: 'perimeter-pest-control',
    displayName: 'Perimeter Pest Control',
    pluralNoun: 'perimeter pest control',
    blurb: 'Most of the insects that turn up indoors came in from the ground and the foundation line. Treating the exterior band around the structure is aimed at keeping them outside rather than dealing with them once they are in.',
    signs: [
      'Ants or spiders appearing along interior walls',
      'Insects around door thresholds and window frames',
      'Webbing under eaves and in corners',
      'Activity in mulch and ground cover against the foundation',
    ],
    treatment: 'The exterior band gets the attention: a treated strip along the foundation, around door and window frames, and at the utility penetrations where the structure is open. Webs and nests under eaves and in corners are knocked down as part of the visit. Conditions holding insects against the house — mulch piled to the siding, ground cover touching the wall, water standing near the foundation — are identified so the treatment is not working against the site.',
    cta: 'Keeping insects out starts at the foundation line, not the baseboard.',
    metaTitle: 'Perimeter Pest Control',
    metaDescription: 'Exterior treatment around the structure to keep common pests outside — foundation band, door and window frames, eaves and utility penetrations.',
  },
  'mosquito-control': {
    slug: 'mosquito-control',
    displayName: 'Mosquito & Tick Control',
    pluralNoun: 'mosquitoes and ticks',
    blurb: 'Mosquitoes and ticks live in the parts of a yard nobody uses — shaded ground cover, leaf litter, tall edges, and water standing somewhere small enough to overlook. Reducing them is as much about those areas as about what gets sprayed.',
    signs: [
      'Mosquito activity in shaded areas during the day',
      'Ticks picked up along yard edges or a wood line',
      'Water standing in containers, gutters or low ground',
      'Heavy leaf litter or dense ground cover at the perimeter',
    ],
    treatment: 'Treatment targets where the insects rest rather than the open lawn: the underside of foliage, shaded ground cover, tall grass at the edge, and the wood line. Standing water is identified and either drained or treated with a larvicide, since a container holding water for a week is a breeding site. Applications repeat on an interval through the season, because treated surfaces weather and new adults move in from off the property.',
    cta: 'Mosquitoes rest in the shade and breed in the water. Treat both.',
    metaTitle: 'Mosquito & Tick Control',
    metaDescription: 'Yard treatment that reduces mosquito and tick populations through the season, targeting resting areas and standing water rather than the open lawn.',
  },
};
