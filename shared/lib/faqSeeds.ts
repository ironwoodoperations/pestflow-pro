// S348 — AUTHORED FAQ seed sets, one per catalog service, per vertical.
//
// WHY AUTHORED AND NOT GENERATED. These strings are published on a client's
// public website and feed a FAQPage JSON-LD block. An AI call per tenant is
// variable quality and a fabrication surface; a reviewed set in the repo is
// identical every time, free at provision, and shows up in a diff. Same
// argument that keeps the vertical content maps out of a prompt.
//
// ── THE RULE THAT DECIDES EVERY LINE IN THIS FILE ────────────────────────────
// FAQ content is TRADE knowledge, never a tenant claim. verticalCopy.ts already
// states it: "a vertical preset holds only what is true of the whole TRADE.
// Nothing here is a tenant fact — no warranty, no licence, no region, no
// scheduling promise."
//
// So: NO licence numbers, NO warranty terms, NO founding year, NO insurance
// claim, NO city, county or region. A test scans every string for those and
// fails on a hit. 'General' is deliberately NOT seeded — that category is where
// the operator puts the tenant's own facts, and seeding it is precisely how a
// stranger's claims would end up in a client's mouth.
//
// ── PROVENANCE, per vertical ─────────────────────────────────────────────────
// LAWN — LIFTED VERBATIM from the grandview tenant's 35 live rows. They were
//   written for this platform, already follow the rule, and rewriting reviewed
//   copy to "freshen" it would only introduce drift. Seven services covered;
//   the other ten lawn catalog slugs need authoring when a client sells one.
//
// IRRIGATION — from pls's live rows, MINUS its three 'General' entries, which
//   are exactly the counter-example: they carry a licence number, a founding
//   year and a warranty term. Four services covered.
//
// PEST — grounded in the dang tenant's 55 live rows, the owner-designated
//   source of truth for pest. NOT lifted verbatim, and this is the one place
//   the brief's word "cherry-pick" understates the work: nearly every dang
//   answer is region-locked ("East Texas humidity", "in Tyler", "the Piney
//   Woods"). Region is a tenant fact under the rule above, and a seed shared by
//   a Phoenix company must not assert a Texas climate. Each answer keeps dang's
//   MECHANISM and drops its geography. Nine species categories map onto catalog
//   slugs; a tenth set for the general 'pest-control' page comes from the
//   genuinely trade-knowledge entries in dang's General category (how pests get
//   in, what a property owner can do, what IPM is) — used as SERVICE content,
//   not as a seeded 'General' category.
//
//   NOT COVERED: termite-control and termite-inspections. dang has no termite
//   FAQs, so there is nothing to ground them in, and inventing termite
//   inspection copy is the exact fabrication this file exists to prevent.
//
// ── SHAPE ────────────────────────────────────────────────────────────────────
// Keyed by SLUG, never by category title, because the same slug is titled
// differently per vertical: 'sprinkler-systems' is "Irrigation Repair" under
// lawn and "Sprinkler Systems" under irrigation, which is what both live
// tenants already show. The category is derived from the catalog at seed time.

import { catalogFor } from './serviceCatalog'

export interface FaqSeed {
  question: string
  answer: string
}

/** slug -> the questions for that service. */
export type VerticalFaqSeeds = Readonly<Record<string, readonly FaqSeed[]>>

// ─────────────────────────────────────────────────────────────── LAWN ────────
// Verbatim from grandview. Do not paraphrase.
const LAWN: VerticalFaqSeeds = Object.freeze({
  'mowing-maintenance': Object.freeze([
    { question: 'How short should my grass be cut?', answer: 'It depends on the grass. St. Augustine wants 2.5 to 4 inches; Bermuda is happier at 1 to 2. Cutting below the range for your type thins the lawn and lets weeds in.' },
    { question: 'How often does a lawn need mowing?', answer: 'Weekly through the growing season. The rule that matters more than the calendar: never take off more than a third of the blade in one cut.' },
    { question: 'Why does my lawn look ragged a day after mowing?', answer: 'Dull blades tear the grass instead of cutting it. The torn tips brown off, and the whole lawn looks pale even though it was just mowed.' },
    { question: 'Should clippings be bagged or left on the lawn?', answer: 'Left, most of the time. They break down quickly and return nitrogen to the soil. Bagging makes sense when the grass is wet, badly overgrown, or diseased.' },
    { question: 'What is the difference between edging and trimming?', answer: 'Edging cuts a clean vertical line along drives and walks. Trimming knocks down the grass a mower cannot reach — fence lines, posts, bed edges.' },
  ]),
  'tree-shrub-trimming': Object.freeze([
    { question: 'When is the right time to trim shrubs?', answer: "Most shrubs in late winter before new growth. Spring bloomers are the exception — prune those right after they flower, or you cut off next year's blooms." },
    { question: 'How much can be taken off at one time?', answer: 'About a quarter of the canopy. Past that, the plant answers with weak, fast water sprouts that need cutting again the following season.' },
    { question: 'Why are my shrubs bare at the bottom?', answer: 'Usually years of shearing the outside flat. The dense top shades out the lower growth. Thinning cuts open the interior back up to light.' },
    { question: 'Should pruning cuts be sealed or painted?', answer: 'No. Sealers trap moisture against the wound. A clean cut just outside the branch collar closes on its own.' },
    { question: 'Can a tall tree be topped to bring the height down?', answer: "Topping is not pruning. It strips the canopy, forces weak regrowth and shortens the tree's life. Proper reduction cuts back to a lateral branch instead." },
  ]),
  'seasonal-cleanup': Object.freeze([
    { question: 'Leaves break down anyway — why clear them?', answer: 'A wet mat of leaves blocks light and holds moisture against the crown of the grass. That is where winter fungus starts.' },
    { question: 'When should perennial beds be cut back?', answer: 'Late winter for most. Leaving the stems standing through the cold protects the crowns and gives beneficial insects somewhere to overwinter.' },
    { question: 'What is the difference between spring and fall cleanup?', answer: 'Fall removes what would smother the lawn over winter. Spring clears the debris that accumulated and preps the beds before growth starts.' },
    { question: 'Should the lawn be cut shorter before winter?', answer: 'One notch shorter, not a scalp. Slightly lower reduces matting under leaves; scalping exposes the crown to cold and sets the lawn back in spring.' },
    { question: 'Do gutters need clearing at the same time?', answer: 'Usually, yes. What comes off the roof ends up in the beds and against the foundation, and that is where most drainage complaints begin.' },
  ]),
  'hardscape-stonework': Object.freeze([
    { question: 'Why do pavers sink or shift over time?', answer: 'Nearly always the base. The depth of the aggregate and how well it was compacted decide whether the surface stays flat, not the stone on top of it.' },
    { question: 'Does a retaining wall need drainage behind it?', answer: 'Yes. Water trapped behind a wall is what pushes it over. Gravel backfill and a drain line give it somewhere to go.' },
    { question: 'Flagstone or pavers — what is the difference?', answer: 'Flagstone is irregular natural stone laid piece by piece. Pavers are uniform and interlock, which holds up better under traffic and repeated freeze cycles.' },
    { question: 'Can a patio be laid over existing concrete?', answer: 'Sometimes, if the slab is sound and drains properly. Concrete that is cracked, heaving or holding water has to come out first.' },
    { question: 'How soon can a new patio be used?', answer: 'Dry-laid stone is ready as soon as it is finished. Mortared work needs a few days to cure before it takes weight.' },
  ]),
  'landscape-design': Object.freeze([
    { question: 'How do I know what will actually grow in my yard?', answer: 'Sun, soil and water decide it before anything else. Plants matched to the conditions of the spot need far less input to look good.' },
    { question: 'How far from the house should shrubs be planted?', answer: 'At their mature width, not the size in the pot. Most foundation and window problems trace back to something planted too close to begin with.' },
    { question: 'How deep should mulch be?', answer: 'Two to three inches. Deeper starts to suffocate roots, and mulch piled against trunks holds moisture where it causes rot.' },
    { question: 'When is the best time to plant?', answer: 'Fall for most trees and shrubs. Roots establish through the cool months so the plant is ready before summer heat arrives.' },
    { question: 'Why does new landscaping struggle its first summer?', answer: "Almost always water. New plantings need deep, infrequent watering aimed at the root ball — the lawn's sprinkler schedule is not enough." },
  ]),
  'sprinkler-systems': Object.freeze([
    { question: 'Why are there dry patches between my sprinkler heads?', answer: 'Head spacing or nozzle choice is wrong for the pressure in that zone. Coverage is a layout problem before it is a watering-schedule problem.' },
    { question: 'Why did my water bill jump with no change in use?', answer: 'Usually a leak underground or a zone running unseen. Isolating the system zone by zone is how it gets found.' },
    { question: 'Can a system be repaired if someone else installed it?', answer: 'Yes. Heads, nozzles, valves, controllers and wiring are all serviceable regardless of who put the system in.' },
    { question: 'How often should a sprinkler system be checked?', answer: 'Twice a year at minimum — once at spring startup and once before the first freeze. Most irrigation damage is found after the fact, not prevented.' },
    { question: 'One zone will not come on. Is the controller bad?', answer: 'Rarely. A single dead zone is usually the valve solenoid or a break in the wire to it. A controller fault normally takes out more than one zone.' },
  ]),
  'artificial-turf': Object.freeze([
    { question: 'Does artificial turf get hot?', answer: 'In direct sun, yes — hotter than living grass. Shade, the infill chosen, and a quick rinse before use all bring the surface temperature down.' },
    { question: 'How does water drain through it?', answer: 'Through a perforated backing into a compacted aggregate base underneath. The base does the draining; the turf just lets water pass.' },
    { question: 'Does it need any maintenance?', answer: 'Less, not none. Brushing keeps the blades upright, rinsing clears dust, and debris needs removing. No mowing, watering or fertilizer.' },
    { question: 'Is it suitable for dogs?', answer: 'Yes, with the right infill and regular rinsing. Urine drains through the backing; solids lift off the surface.' },
    { question: 'How long does artificial turf last?', answer: 'Commonly fifteen years or more, depending on traffic and sun exposure. The base underneath usually determines how well it ages, not the fibres.' },
  ]),
})

// ───────────────────────────────────────────────────────── IRRIGATION ────────
// From pls, minus its three tenant-fact 'General' rows. artificial-turf is the
// same trade knowledge as lawn's and is shared deliberately.
const IRRIGATION: VerticalFaqSeeds = Object.freeze({
  'sprinkler-systems': Object.freeze([
    { question: 'Why does my water bill keep climbing?', answer: 'A climbing bill with no change in use usually means a leak or a zone running unseen. Isolating the system zone by zone is how the problem is found.' },
    { question: 'Can you repair a system you did not install?', answer: 'Yes. Heads, nozzles, valves, controllers and wiring are all serviceable on an existing system, whoever installed it.' },
    { question: 'Why are there dry patches between my sprinkler heads?', answer: "Dry patches usually mean head spacing or nozzle selection is wrong for the zone's pressure. Coverage is a layout problem first, not a watering-schedule problem." },
  ]),
  drainage: Object.freeze([
    { question: 'Will a french drain really stop water standing in my yard?', answer: 'When it is built to grade with washed gravel and sock-wrapped pipe, yes — water moves to daylight or a catch basin instead of sitting in the soil.' },
    { question: 'Water runs toward my foundation when it rains. Can that be fixed?', answer: 'Yes — usually with a combination of regrading and surface or french drains that intercept the water and carry it away from the house.' },
  ]),
  'pump-systems': Object.freeze([
    { question: 'Can I irrigate from my lake or pond?', answer: 'Yes. Pump systems for lake, pond and well irrigation are sized so the pump and intake match the zones they feed and pressure holds at the last head.' },
  ]),
  'sod-dirt-work': Object.freeze([
    { question: 'Do you fix low spots that hold water?', answer: 'Yes. Cut and fill corrects the grade, compacting in lifts holds it, and the finish sheds water where it should before sod goes over prepared ground.' },
  ]),
  'artificial-turf': Object.freeze([
    { question: 'Does artificial turf get hot?', answer: 'In direct sun, yes — hotter than living grass. Shade, the infill chosen, and a quick rinse before use all bring the surface temperature down.' },
    { question: 'How does water drain through it?', answer: 'Through a perforated backing into a compacted aggregate base underneath. The base does the draining; the turf just lets water pass.' },
    { question: 'Does it need any maintenance?', answer: 'Less, not none. Brushing keeps the blades upright, rinsing clears dust, and debris needs removing. No mowing, watering or fertilizer.' },
  ]),
})

// ─────────────────────────────────────────────────────────────── PEST ────────
// Grounded in dang's rows; geography removed. See the provenance note above.
const PEST: VerticalFaqSeeds = Object.freeze({
  'pest-control': Object.freeze([
    { question: 'How are pests getting into my home?', answer: 'Through gaps far smaller than they look — weep holes, gaps around pipes and windows, and overhanging branches and vines that bridge straight to the roof.' },
    { question: 'Why are pests in my house at all?', answer: 'Three things draw them: a food source, moisture, and somewhere sheltered to nest. Remove one and the property becomes markedly less attractive.' },
    { question: 'What can I do myself between treatments?', answer: 'Store food sealed, clear clutter and debris that makes nesting material, fix leaks and standing water, and seal gaps around doors, pipes and siding.' },
    { question: 'What is Integrated Pest Management?', answer: 'A strategy that combines exclusion, habitat changes, monitoring and targeted product use rather than relying on spray alone, aiming at long-term control.' },
    { question: 'Should I expect to see more pests right after a treatment?', answer: 'Often, yes. Products that flush pests out of voids push activity into the open before it drops. A short rise immediately after service is normal.' },
  ]),
  'ant-control': Object.freeze([
    { question: 'Why do ants keep coming back indoors?', answer: 'The colony lives outside and sends scouts in for moisture and food. Treating the trail you can see never reaches the nest producing it.' },
    { question: 'Are fire ants dangerous?', answer: 'They sting repeatedly and the whole mound responds at once when disturbed, so children and pets come off worst. Mounds often appear after heavy rain.' },
    { question: 'Does it matter which kind of ant I have?', answer: 'Yes. Fire ants, carpenter ants and odorous house ants nest differently and take different baits, so identification comes before any treatment.' },
    { question: 'When are ants most active?', answer: 'Spring and summer are the peak. Where winters stay mild, colonies remain active nearly year-round and pressure never fully drops off.' },
  ]),
  'roach-control': Object.freeze([
    { question: 'Why do I see large roaches after heavy rain?', answer: 'Rain floods storm drains and sewers and pushes them out. They are moisture-seeking, so a wet spell drives them toward the drier ground inside.' },
    { question: 'Does one roach mean an infestation?', answer: 'Not always, but it is rarely alone. German roaches in particular breed indoors and multiply quickly once a few are established.' },
    { question: 'Which roaches turn up in houses?', answer: 'Usually American cockroaches — the large ones, sometimes called palmetto bugs — and German cockroaches, which are smaller and breed indoors.' },
    { question: 'How do I keep roaches out?', answer: 'Moisture control and a treated perimeter do most of the work. Fixing leaks and ventilating damp areas removes what draws them in the first place.' },
  ]),
  'spider-control': Object.freeze([
    { question: 'Why are there so many spiders around my porch lights?', answer: 'Spiders follow their food. Porch lights pull in flying insects all night, and the webs go up where the meals are.' },
    { question: 'Are brown recluse spiders something to worry about?', answer: 'They prefer undisturbed spaces — garages, attics, storage boxes — and bite when trapped against skin. Reducing clutter removes most of the harbourage.' },
    { question: 'Are black widows dangerous?', answer: 'Their bite is venomous and worth medical attention. They sit in dark, undisturbed places: woodpiles, meter boxes, the underside of furniture.' },
    { question: 'Will treatment get rid of the webs?', answer: 'Exterior treatment reduces the population over time, and knocking webs down removes the anchor points. Both together keep the eaves clear.' },
  ]),
  'rodent-control': Object.freeze([
    { question: 'How small an opening can a mouse get through?', answer: 'About the size of a dime. Rats need only a quarter. Gaps at pipe penetrations, foundation vents and garage door corners are the usual routes.' },
    { question: 'What attracts rodents to a property?', answer: 'Pet food, bird feeders, fallen fruit and nuts, and dense planting right against the walls that gives them cover to move in unseen.' },
    { question: 'When are rodents most active?', answer: 'Pressure rises as it cools and they look for shelter, but where winters are mild they stay active all year and never fully move back out.' },
    { question: 'Is trapping enough on its own?', answer: 'It removes what is already inside but not the way in. Without sealing the entry points, the space simply gets repopulated.' },
  ]),
  'mosquito-control': Object.freeze([
    { question: 'Do yard treatments actually work?', answer: 'Yes. Treating the shaded resting places adults use, and removing what they breed in, cuts numbers substantially through the season.' },
    { question: 'How little water do mosquitoes need to breed?', answer: 'A bottle cap is enough. Saucers, gutters, tarps and toys hold more than that, which is why source reduction matters more than fogging.' },
    { question: 'When does mosquito season start?', answer: 'Activity picks up as soon as temperatures stay consistently warm and runs until they drop, which in warmer regions is most of the year.' },
    { question: 'Why are mosquitoes worse after a mild winter?', answer: 'A cold snap kills overwintering adults and eggs. Without one, far more survive into spring and the season starts from a much larger population.' },
  ]),
  'wasp-hornet-control': Object.freeze([
    { question: 'Should I knock a wasp nest down myself?', answer: 'Not advisable. Wasps defend the nest as a group and can sting repeatedly, and a partly removed nest is often rebuilt within days.' },
    { question: 'Why do wasps get more aggressive late in summer?', answer: 'Colonies are at their largest then and food is scarcer, so there are more defenders and shorter tempers around the same nest.' },
    { question: 'Are yellow jackets different from other wasps?', answer: 'Yes. They nest underground or inside wall voids rather than in the open, so most stings happen when mowing or landscaping disturbs one unseen.' },
    { question: 'Where do wasps usually build?', answer: 'Under eaves and porch ceilings, in sheds, and inside play equipment — sheltered spots with an overhang and little through traffic.' },
    { question: 'Do the same nests come back each year?', answer: 'The nest is not reused, but fertilised queens overwinter nearby and rebuild in the same favourable spots, which is why the location repeats.' },
  ]),
  'scorpion-control': Object.freeze([
    { question: 'How do scorpions get inside?', answer: 'Through foundation cracks, gaps under doors and around utility penetrations. They are flat enough to pass through openings that look far too small.' },
    { question: 'Are scorpion stings dangerous?', answer: 'Most are painful rather than serious, but children, older adults and pets can react more strongly and are worth watching after a sting.' },
    { question: 'What draws scorpions to a property?', answer: 'Harbourage and prey. Stacked wood, rock beds and stored materials give them somewhere to hide, and the insects living there feed them.' },
    { question: 'When are scorpions most active?', answer: 'Through the hot months, and mostly at night. They also move indoors ahead of heavy rain or a sharp change in temperature.' },
  ]),
  'bed-bug-control': Object.freeze([
    { question: 'Can I treat bed bugs myself?', answer: 'Rarely with success. They shelter in mattress seams, frame joints and wall voids, and a surface spray leaves the population that matters untouched.' },
    { question: 'How did bed bugs get into my home?', answer: 'They travel on luggage, clothing and second-hand furniture, and move between units through shared walls. It is not a question of cleanliness.' },
    { question: 'How fast does an infestation grow?', answer: 'Quickly. A small introduction can become a widespread problem in a matter of weeks, which is why early treatment is much easier than late.' },
    { question: 'How do I know it is bed bugs?', answer: 'Bites in lines on skin exposed while sleeping, dark specks along mattress seams, and shed skins near the headboard are the usual signs.' },
  ]),
  'flea-tick-control': Object.freeze([
    { question: 'Can fleas be in my yard with no pets?', answer: 'Yes. Raccoons, opossums, squirrels and stray animals carry them in, and the eggs drop wherever those animals travel.' },
    { question: 'Why do fleas keep coming back after treatment?', answer: 'Eggs and pupae survive a single application. Control needs the follow-up timed to catch the next generation as it emerges.' },
    { question: 'Where do ticks wait for a host?', answer: 'On tall grass, brush and the edges of wooded areas, at about knee height. Keeping grass short and clearing brush lines removes most of it.' },
    { question: 'When is flea and tick season?', answer: 'Spring through autumn is the peak, and where winters are mild both survive year-round rather than dying back.' },
  ]),
})

/**
 * Seed sets by vertical. A vertical with no entry seeds nothing, which is the
 * same choice serviceCatalog makes: an unknown trade serves nothing rather than
 * another trade's content.
 */
export const FAQ_SEEDS: Readonly<Record<string, VerticalFaqSeeds>> = Object.freeze({
  pest: PEST,
  irrigation: IRRIGATION,
  lawn: LAWN,
})

/** The seeds for one service of one vertical. Empty when not authored yet. */
export function faqSeedsFor(vertical: string | null | undefined, slug: string): readonly FaqSeed[] {
  const set = (vertical && FAQ_SEEDS[vertical]) || undefined
  return set?.[slug] ?? EMPTY
}

const EMPTY: readonly FaqSeed[] = Object.freeze([])

// ─────────────────────────────────────────────────── BUILDING THE ROWS ───────

/** A row as public.faqs holds it, minus tenant_id and the generated id. */
export interface FaqRow {
  question: string
  answer: string
  category: string
  sort_order: number
}

/** One decade of sort_order per service, matching what the live tenants show. */
export const FAQ_SORT_STRIDE = 10

/**
 * The FAQ rows to seed for a tenant.
 *
 * `selected` is the tenant's CHOSEN services — the same rule page_content and
 * seo_meta already follow. A lawn tenant selling seven does not get FAQs for
 * seventeen. Absent `selected` means "not stated" and seeds the whole catalog,
 * which is the ABSENT-vs-EMPTY contract established in S341: `[]` is a
 * statement of nothing and seeds nothing.
 *
 * CATEGORY COMES FROM THE CATALOG, not from the seed data, because the same
 * slug carries different titles per vertical — 'sprinkler-systems' is
 * "Irrigation Repair" under lawn and "Sprinkler Systems" under irrigation.
 * Both live tenants already display it that way.
 *
 * Ordering follows CATALOG order, not the order the operator picked, so two
 * tenants selling the same services get the same page in the same sequence.
 */
export function buildFaqRows(
  vertical: string | null | undefined,
  selected?: readonly string[],
): FaqRow[] {
  const catalog = catalogFor(vertical)
  const want = selected === undefined ? null : new Set(selected)

  const rows: FaqRow[] = []
  let decade = 0
  for (const service of catalog) {
    if (want !== null && !want.has(service.slug)) continue
    const seeds = faqSeedsFor(vertical, service.slug)
    if (seeds.length === 0) continue
    decade += FAQ_SORT_STRIDE
    seeds.forEach((seed, i) => {
      rows.push({
        question: seed.question,
        answer: seed.answer,
        category: service.title,
        sort_order: decade + i,
      })
    })
  }
  return rows
}
