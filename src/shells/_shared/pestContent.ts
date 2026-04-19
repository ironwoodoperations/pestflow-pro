export interface PestEntry {
  slug: string;
  displayName: string;
  pluralNoun: string;
  blurb: string;
  signs: string[];
  treatment: string;
  cta: string;
  metaTitle: string;
  metaDescription: string;
}

export const PEST_CONTENT_MAP: Record<string, PestEntry> = {
  'ant-control': {
    slug: 'ant-control',
    displayName: 'Ants',
    pluralNoun: 'ants',
    blurb: 'Ant colonies can number in the thousands, and by the time you see a trail on the counter, the nest is already established nearby. Effective ant control targets the colony, not just the ants you see.',
    signs: [
      'Visible trails along baseboards, counters, or sinks',
      'Small dirt mounds near foundation or driveway cracks',
      'Rustling sounds in walls (carpenter ants)',
      'Piles of fine sawdust near wood framing',
    ],
    treatment: 'We identify the species first — the treatment for carpenter ants is different from sugar ants. Non-repellent baits carry the active ingredient back to the colony, which is what actually solves the problem long-term.',
    cta: 'Getting rid of ants for good starts with finding the nest.',
    metaTitle: 'Ant Control & Extermination Services',
    metaDescription: 'Professional ant control targeting the colony, not just the ants you see. Licensed, guaranteed, and safe for your family.',
  },
  'bed-bug-control': {
    slug: 'bed-bug-control',
    displayName: 'Bed Bugs',
    pluralNoun: 'bed bugs',
    blurb: 'Bed bugs are the pest nobody wants to talk about and the hardest to get rid of on your own. Store-bought sprays scatter them deeper into walls and furniture, making the problem worse.',
    signs: [
      'Small rust-colored spots on sheets or mattress seams',
      'Itchy bites in a line or cluster pattern',
      'Tiny translucent eggs in seams of mattresses or couches',
      'A musty, sweet odor in heavily infested rooms',
    ],
    treatment: 'Bed bug eradication requires a combination of steam, targeted residual treatment, and a follow-up visit 14 days later to catch newly hatched bugs. We treat seams, box springs, baseboards, and any adjacent rooms.',
    cta: 'Early treatment is faster and cheaper — call before it spreads.',
    metaTitle: 'Bed Bug Extermination & Heat Treatment',
    metaDescription: 'Professional bed bug treatment that actually works. Combination steam, residual, and follow-up visit included.',
  },
  'roach-control': {
    slug: 'roach-control',
    displayName: 'Cockroaches',
    pluralNoun: 'cockroaches',
    blurb: 'Cockroaches carry bacteria into kitchens and bathrooms, and a single female German cockroach can produce 300 offspring in her lifetime. Seeing one during the day usually means the population has outgrown its hiding spots.',
    signs: [
      'Droppings that look like coffee grounds in drawers or under sinks',
      'A musty, oily smell in cabinets',
      'Shed skins or egg casings behind appliances',
      'Roaches visible during daylight hours',
    ],
    treatment: "We use targeted gel baits and insect growth regulators in cabinets, under appliances, and along plumbing penetrations. Spray alone rarely solves a cockroach problem — the bait-and-IGR combination does.",
    cta: "A roach problem doesn't fix itself. Call us today.",
    metaTitle: 'Cockroach Control & Extermination',
    metaDescription: 'Targeted gel bait and IGR treatment for cockroaches. Safe for kitchens, effective against German and American roaches.',
  },
  'flea-tick-control': {
    slug: 'flea-tick-control',
    displayName: 'Fleas & Ticks',
    pluralNoun: 'fleas and ticks',
    blurb: "Fleas and ticks don't just bite pets — they bring disease risk and can establish in carpets, pet bedding, and yards. Treating the animal is only half the job.",
    signs: [
      'Pets scratching or biting at their fur repeatedly',
      'Small dark specks (flea dirt) on pet bedding or skin',
      'Red itchy bites on ankles after walking across carpet',
      'Ticks attached to pets after time spent in tall grass',
    ],
    treatment: 'We treat the yard perimeter and indoor areas where pets spend time. Coordinate with your vet on pet treatment for the fastest knockdown. Follow-up service at 14 days catches the next hatch cycle.',
    cta: 'Protect your pets and your family — call for a yard treatment.',
    metaTitle: 'Flea & Tick Control for Home and Yard',
    metaDescription: 'Professional flea and tick treatment for yards and indoor spaces. Safe for pets, effective within hours.',
  },
  'mosquito-control': {
    slug: 'mosquito-control',
    displayName: 'Mosquitoes',
    pluralNoun: 'mosquitoes',
    blurb: "Mosquitoes don't just ruin backyard evenings — they carry West Nile, Zika, and other viruses. Effective mosquito control reduces the breeding population around your property, not just the ones actively biting.",
    signs: [
      'Active biting during early morning and dusk',
      'Standing water in gutters, plant saucers, or tarps',
      'Buzzing near screened porches and patios',
      'Larvae (small wigglers) in any standing water',
    ],
    treatment: 'Monthly barrier treatments on vegetation where mosquitoes rest during the day, combined with targeted breeding-site elimination. Most clients see an 80%+ reduction after the first treatment.',
    cta: 'Take your yard back. Ask about our monthly mosquito program.',
    metaTitle: 'Mosquito Control & Yard Treatment',
    metaDescription: 'Monthly mosquito barrier treatment to reclaim your yard. Safe for pets, effective within 24 hours.',
  },
  'rodent-control': {
    slug: 'rodent-control',
    displayName: 'Rodents',
    pluralNoun: 'rodents',
    blurb: 'Rats and mice chew through wiring, insulation, and food packaging, and a single pair can produce dozens of offspring a year. Rodents also carry fleas, ticks, and several diseases.',
    signs: [
      'Droppings in pantries, under sinks, or in attics',
      'Gnaw marks on baseboards or food packaging',
      'Scratching or scurrying sounds in walls or ceilings at night',
      'A stale, musky smell from entry points',
    ],
    treatment: 'We inspect for entry points, seal gaps with steel wool and foam, and place tamper-resistant bait stations or snap traps in strategic locations. Exterior rodent stations around the foundation prevent re-entry.',
    cta: 'Rodents multiply fast. Call today for an inspection.',
    metaTitle: 'Rodent & Mouse Control Services',
    metaDescription: 'Comprehensive rodent control: entry-point sealing, trapping, and exterior bait stations. Humane and effective.',
  },
  'scorpion-control': {
    slug: 'scorpion-control',
    displayName: 'Scorpions',
    pluralNoun: 'scorpions',
    blurb: 'Scorpions are nocturnal hunters that come indoors looking for water and the insects they prey on. Controlling the insect population around your home removes their food source and reduces scorpion pressure dramatically.',
    signs: [
      'Scorpions visible under UV blacklight at night',
      'Sightings near garages, pool areas, or block walls',
      'Cricket populations in landscaping (scorpion food)',
      'Shed exoskeletons in seldom-used corners',
    ],
    treatment: 'A combination of interior residual treatment along baseboards, exterior perimeter spray, and granular treatment in landscaping. We also identify and seal common entry points (weep holes, gaps under doors).',
    cta: 'Scorpion stings are serious. Let us handle it.',
    metaTitle: 'Scorpion Control & Prevention',
    metaDescription: 'Effective scorpion control combining interior, perimeter, and landscape treatment with entry-point sealing.',
  },
  'spider-control': {
    slug: 'spider-control',
    displayName: 'Spiders',
    pluralNoun: 'spiders',
    blurb: 'Most spiders are harmless and actually helpful, but brown recluse and black widows are medically significant. Reducing the insect population around your home reduces all spider activity.',
    signs: [
      'Webs in corners, basements, or garage overhangs',
      'Egg sacs in undisturbed areas',
      'Brown recluse identification (violin marking on back)',
      'Black widow sightings around woodpiles or sheds',
    ],
    treatment: 'Targeted treatment of harborage areas — garage corners, eaves, crawl spaces — plus perimeter treatment to reduce the insect prey base. Web removal during service visits prevents re-colonization.',
    cta: 'Worried about recluse or widow spiders? We can help.',
    metaTitle: 'Spider Control & Web Removal',
    metaDescription: 'Professional spider control with focus on medically significant species. Perimeter treatment and harborage removal.',
  },
  'termite-control': {
    slug: 'termite-control',
    displayName: 'Termites',
    pluralNoun: 'termites',
    blurb: "Termites cause more damage to US homes than fires, floods, and tornadoes combined — and most homeowners insurance doesn't cover the repair. Annual inspections catch the problem before the damage is structural.",
    signs: [
      'Mud tubes on foundation walls or in crawl spaces',
      'Discarded wings near windowsills after spring swarms',
      'Wood that sounds hollow when tapped',
      'Buckling paint or floors that seem to sag',
    ],
    treatment: 'We use liquid termiticide treatments around the foundation perimeter and targeted bait stations where needed. Treatments come with a renewable warranty — most clients renew annually for peace of mind.',
    cta: 'Termite damage is expensive. Annual inspections are cheap.',
    metaTitle: 'Termite Treatment & Protection',
    metaDescription: 'Termite treatment with liquid termiticide and bait stations. Comes with renewable warranty. Annual inspections available.',
  },
  'termite-inspections': {
    slug: 'termite-inspections',
    displayName: 'Termite Inspections',
    pluralNoun: 'termite inspections',
    blurb: 'A termite inspection is the cheapest insurance a homeowner can buy. Most real estate transactions require one, and lenders often require annual renewals on warranted properties.',
    signs: [
      'Real estate purchase or refinance requires WDI report',
      'Visible signs (mud tubes, wings, wood damage)',
      'Annual warranty renewal required by previous treatment',
      'New construction with no prior inspection history',
    ],
    treatment: 'A licensed technician inspects the foundation, crawl space, attic, and visible wood framing for active termites, prior damage, and conducive conditions. You receive a written WDI (Wood Destroying Insect) report within 48 hours.',
    cta: 'Scheduling a real estate inspection? Call today.',
    metaTitle: 'Termite Inspections & WDI Reports',
    metaDescription: 'Licensed termite inspections with written WDI reports within 48 hours. Real estate transactions and annual renewals.',
  },
  'wasp-hornet-control': {
    slug: 'wasp-hornet-control',
    displayName: 'Wasps & Hornets',
    pluralNoun: 'wasps and hornets',
    blurb: "Wasps and hornets become aggressive defending their nests, and stings can be dangerous for anyone with allergies. Nest removal requires the right equipment and the right time of day — and shouldn't be a DIY job for anything larger than a fist.",
    signs: [
      'Nests in eaves, attics, playground equipment, or sheds',
      'Increased activity around the home in late summer',
      'Ground nests in landscape beds (yellowjackets)',
      'Clicking sounds in walls (possible in-wall nest)',
    ],
    treatment: 'We treat the nest directly with a residual knockdown product, then physically remove the nest once activity ceases. Nests in walls or attics get special attention to prevent honey/larvae from attracting secondary pests.',
    cta: 'Do not try to knock down a large nest yourself — call us.',
    metaTitle: 'Wasp & Hornet Nest Removal',
    metaDescription: 'Professional wasp and hornet nest removal. Safe, same-day service for accessible nests. Call before attempting DIY.',
  },
  'pest-control': {
    slug: 'pest-control',
    displayName: 'General Pest Control',
    pluralNoun: 'pests',
    blurb: 'Our general pest control program is a quarterly service that keeps the common household pests out year-round — ants, spiders, roaches, silverfish, earwigs, centipedes, and more. Most clients on the program never see another pest inside.',
    signs: [
      'Seeing any of: ants, spiders, roaches, silverfish',
      'Wanting proactive prevention vs reactive treatment',
      'New construction or recent move-in',
      'Previous pest problems that keep returning',
    ],
    treatment: 'Four visits per year (one per season) with interior and exterior treatment on the first visit, then exterior-focused maintenance on the remaining three. Free re-service between visits if pests return. Fully warranted.',
    cta: 'Ask about our quarterly pest control program.',
    metaTitle: 'Quarterly Pest Control Program',
    metaDescription: 'Year-round pest prevention with four quarterly visits. Free re-service between visits. Covers ants, spiders, roaches, and more.',
  },
};

export function getPest(slug: string): PestEntry | null {
  return PEST_CONTENT_MAP[slug] ?? null;
}
