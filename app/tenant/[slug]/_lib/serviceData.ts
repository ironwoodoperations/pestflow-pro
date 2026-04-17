export type ServiceData = {
  heroTitle: string
  heroHighlight: string
  heroSubtitle: string
  introHeading: string
  introP1: string
  introP2: string
  steps: { title: string; desc: string }[]
  faqs: { q: string; a: string }[]
}

export const PEST_IMAGES: Record<string, string> = {
  'pest-control':        '/images/pests/pest_control.jpg',
  'roach-control':       '/images/pests/roach.jpg',
  'rodent-control':      '/images/pests/rodent.jpg',
  'mosquito-control':    '/images/pests/Mosquito.jpg',
  'termite-control':     '/images/pests/termite_control.jpg',
  'termite-inspections': '/images/pests/termite_inspection.jpg',
  'ant-control':         '/images/pests/ant.jpg',
  'spider-control':      '/images/pests/spider.jpg',
  'bed-bug-control':     '/images/pests/bed_bug.jpg',
  'wasp-hornet-control': '/images/pests/wasp_hornet.jpg',
  'scorpion-control':    '/images/pests/scorpion.jpg',
  'flea-tick-control':   '/images/pests/flea_tik.jpg',
}

export const SERVICE_DATA: Record<string, ServiceData> = {
  'pest-control': {
    heroTitle: 'General Pest Control', heroHighlight: 'Pest Control',
    heroSubtitle: 'One plan. All pests. Year-round protection.',
    introHeading: 'Complete Home Pest Protection',
    introP1: "Our general pest control plans provide comprehensive protection against all common household pests. We target the root cause — not just the symptoms you can see.",
    introP2: "Trained technicians perform a full inspection, then create a customized treatment plan. We treat both interior and exterior, creating a protective barrier around your home.",
    steps: [
      { title: 'Full Inspection', desc: 'Comprehensive inspection of your entire property to identify all pest activity and entry points.' },
      { title: 'Custom Plan', desc: 'Customized treatment plan based on your home, pest pressures, and family needs.' },
      { title: 'Treatment', desc: 'Interior and exterior treatment targeting all active pests with a protective perimeter barrier.' },
      { title: 'Maintenance', desc: 'Quarterly maintenance visits to maintain protection and catch new pest activity early.' },
    ],
    faqs: [
      { q: 'What pests are covered?', a: 'Ants, spiders, roaches, wasps, silverfish, earwigs, crickets, millipedes, and other common household pests. Specialty pests (termites, bed bugs, rodents) require separate services.' },
      { q: 'How often do you treat?', a: 'Quarterly treatments for most homes. Homes with heavy pressure may benefit from monthly service.' },
      { q: 'Are treatments safe for kids and pets?', a: 'Yes. All products are EPA-approved. Safe for your family once dry — typically 30–60 minutes.' },
      { q: 'What if pests return between visits?', a: 'All plans include free re-treatments between scheduled visits. We stand behind our service.' },
      { q: 'Do you offer a guarantee?', a: 'Yes. If pests return between scheduled services, we will retreat at no additional cost.' },
    ],
  },

  'ant-control': {
    heroTitle: 'Ant Control', heroHighlight: 'Ant Control',
    heroSubtitle: 'Eliminate fire ants, carpenter ants, and more.',
    introHeading: 'Effective Ant Control Solutions',
    introP1: "Ants are the #1 nuisance pest. From painful fire ant stings in your yard to carpenter ants destroying your wood structure, ant infestations require professional treatment to fully eliminate.",
    introP2: "Our ant control program identifies the species, then targets the colony at its source using baits, direct nest treatments, and perimeter barriers to eliminate existing colonies and prevent new ones.",
    steps: [
      { title: 'Identify', desc: 'Determine ant species and locate colony entry points, trails, and nesting sites.' },
      { title: 'Bait & Treat', desc: 'Apply targeted bait systems and direct colony treatments to eliminate the queen and workers.' },
      { title: 'Barrier', desc: 'Create an exterior perimeter barrier to prevent new colonies from establishing.' },
      { title: 'Follow Up', desc: 'Follow-up inspection to verify elimination and treat any remaining activity.' },
    ],
    faqs: [
      { q: 'Why do ants keep coming back after I spray?', a: 'Over-the-counter sprays only kill ants on contact. The queen keeps producing new workers. Professional baits are carried back to the colony, killing the queen and the entire nest.' },
      { q: 'How long does ant treatment take to work?', a: 'Bait treatments take 1–2 weeks to fully eliminate a colony. You may see increased activity initially — this means the bait is working.' },
      { q: 'Are fire ant treatments safe for my lawn?', a: 'Yes. Our fire ant treatments are granular baits safe for lawns, gardens, and areas where children and pets play.' },
      { q: 'Do carpenter ants cause as much damage as termites?', a: 'Carpenter ants can cause significant structural damage over time. They hollow out wood for nesting but do not eat it.' },
      { q: 'Do you offer a guarantee?', a: 'Yes. If ants return between scheduled services, we will retreat at no additional cost.' },
    ],
  },

  'roach-control': {
    heroTitle: 'Cockroach Control', heroHighlight: 'Cockroach Control',
    heroSubtitle: 'Complete roach elimination — inside and out.',
    introHeading: 'Expert Cockroach Extermination',
    introP1: "Cockroaches spread bacteria, trigger allergies, and contaminate food. A single sighting usually means dozens more are hiding in walls, cabinets, and appliances.",
    introP2: "Our program uses gel baits, residual sprays, and crack-and-crevice treatments to eliminate roaches at every life stage — eggs, nymphs, and adults.",
    steps: [
      { title: 'Inspect', desc: 'Thorough inspection of kitchens, bathrooms, and all harborage areas to assess infestation severity.' },
      { title: 'Bait & Spray', desc: 'Apply gel bait in cracks and crevices combined with residual spray in harborage areas.' },
      { title: 'Crack & Crevice', desc: 'Targeted treatment of wall voids, baseboards, and pipe penetrations where roaches hide.' },
      { title: 'Prevent', desc: 'Follow-up treatment and sanitation recommendations to prevent re-infestation.' },
    ],
    faqs: [
      { q: 'Why do I keep seeing roaches after spraying?', a: 'DIY sprays only kill roaches on contact. Professional gel baits are carried back to the nest, eliminating the entire population over 1–2 weeks.' },
      { q: 'How long does cockroach treatment take?', a: 'Initial treatment takes 60–90 minutes. You will see significant reduction within the first week, with full elimination typically within 2–3 weeks.' },
      { q: 'Do I need to leave my home during treatment?', a: 'No. Our treatments are applied in targeted areas and are safe for occupied homes.' },
      { q: 'Are cockroaches dangerous to my health?', a: 'Yes. Cockroaches spread salmonella, E. coli, and other bacteria. Their droppings trigger allergies and asthma, especially in children.' },
      { q: 'Do you guarantee roach elimination?', a: 'Yes. If roaches return between services, we retreat at no additional cost.' },
    ],
  },

  'rodent-control': {
    heroTitle: 'Rodent Control', heroHighlight: 'Rodent Control',
    heroSubtitle: 'Mice and rats eliminated — entry points sealed.',
    introHeading: 'Professional Rodent Extermination & Exclusion',
    introP1: "Rodents cause extensive damage — chewing electrical wires (fire hazard), contaminating food, spreading disease, and creating unsanitary nesting areas in attics, walls, and crawlspaces.",
    introP2: "Our program goes beyond trapping. We perform a full exclusion — sealing every entry point mice and rats use to enter your home. A mouse can fit through a hole the size of a dime.",
    steps: [
      { title: 'Full Inspection', desc: 'Inspect attic, crawlspace, exterior foundation, and roof for entry points, droppings, and nesting.' },
      { title: 'Bait & Trap', desc: 'Strategic placement of bait stations and traps in activity areas for rapid population reduction.' },
      { title: 'Exclusion', desc: 'Seal all entry points with steel wool, metal flashing, and professional-grade materials.' },
      { title: 'Sanitation', desc: 'Guidance on removing nesting materials, cleaning contaminated areas, and preventing re-entry.' },
    ],
    faqs: [
      { q: 'How do mice get into my house?', a: 'Mice can fit through openings as small as a dime. Common entry points include gaps around pipes, AC lines, dryer vents, garage doors, and foundation cracks.' },
      { q: 'Are rodent droppings dangerous?', a: 'Yes. Rodent droppings can carry hantavirus, salmonella, and other pathogens. Always wear gloves and a mask when cleaning.' },
      { q: 'How long does rodent exclusion take?', a: 'A typical exclusion takes 2–4 hours. Trapping and monitoring continue for 2–4 weeks to ensure full resolution.' },
      { q: 'Will poison kill rodents in my walls?', a: 'We prefer trapping inside homes because poisoned rodents can die in wall voids, causing odor problems.' },
      { q: 'How can I prevent rodents from returning?', a: 'Professional exclusion is the most effective prevention. Keep vegetation trimmed, store food in sealed containers, and eliminate water sources.' },
    ],
  },

  'mosquito-control': {
    heroTitle: 'Mosquito Control', heroHighlight: 'Mosquito Control',
    heroSubtitle: 'Take back your yard — guaranteed mosquito reduction.',
    introHeading: 'Mosquito Control Experts',
    introP1: "Warm climates and abundant standing water make ideal breeding grounds for mosquitoes. These pests carry dangerous diseases including West Nile virus and Zika — making professional mosquito control essential.",
    introP2: "Our program targets both adult mosquitoes and breeding sites using barrier sprays, larvicide treatments, and automatic misting systems to dramatically reduce mosquito populations.",
    steps: [
      { title: 'Inspect', desc: 'Identify all breeding sites including standing water, clogged gutters, and low-lying areas.' },
      { title: 'Treat', desc: 'Apply barrier spray to foliage and treat standing water with EPA-approved larvicide.' },
      { title: 'Install', desc: 'Recommend and install automatic misting systems for continuous protection.' },
      { title: 'Maintain', desc: 'Monthly maintenance visits to reapply treatments and inspect for new breeding sites.' },
    ],
    faqs: [
      { q: 'How effective is professional mosquito control?', a: 'Our treatments typically reduce mosquito populations by 85–90% on your property.' },
      { q: 'Are treatments safe for pets?', a: 'Yes. Once the treatment dries (typically 30 minutes), it is safe for pets and children.' },
      { q: 'How often should I treat for mosquitoes?', a: 'Monthly treatments are recommended during mosquito season for continuous protection.' },
      { q: 'Do you treat for mosquito larvae?', a: 'Yes. We treat all standing water sources with larvicide to prevent mosquitoes from breeding on your property.' },
      { q: 'Can I get a one-time treatment for an event?', a: 'Absolutely. One-time barrier treatments are ideal for outdoor events. Apply 24–48 hours before your event.' },
    ],
  },

  'termite-control': {
    heroTitle: 'Termite Control', heroHighlight: 'Termite Control',
    heroSubtitle: 'Stop termites before they destroy your home.',
    introHeading: 'Professional Termite Extermination',
    introP1: "Termites cause over $5 billion in property damage annually. Subterranean termites can silently eat through your home's structure for years before you notice any damage.",
    introP2: "Our program uses industry-leading liquid barrier treatments (Termidor) and bait station systems to create a lethal zone around your home. Termites that contact treated soil carry the product back to the colony, eliminating it completely.",
    steps: [
      { title: 'Inspection', desc: 'Thorough inspection of foundation, crawlspace, attic, and exterior for signs of activity.' },
      { title: 'Liquid Barrier', desc: 'Termidor liquid barrier treatment around the entire foundation, creating a lethal zone termites cannot detect.' },
      { title: 'Bait Stations', desc: 'Installation of monitoring bait stations around the perimeter for ongoing detection and colony elimination.' },
      { title: 'Annual Monitoring', desc: 'Annual inspection and bait station monitoring to ensure continued protection.' },
    ],
    faqs: [
      { q: 'How do I know if I have termites?', a: 'Look for mud tubes on foundation walls, hollow-sounding wood, discarded wings near windows, and bubbling paint.' },
      { q: 'What is Termidor treatment?', a: 'Termidor is the #1 termite defense product worldwide. Applied as a liquid barrier around your foundation — termites cannot detect it and transfer it to colony members, eliminating the entire colony.' },
      { q: 'How long does termite treatment last?', a: 'Termidor liquid barrier treatments provide protection for 5–10+ years. Bait stations provide continuous monitoring with annual service.' },
      { q: 'Is termite damage covered by insurance?', a: 'Most homeowner insurance policies do NOT cover termite damage. Annual inspections are your best protection.' },
      { q: 'Do you offer a termite warranty?', a: 'Yes. Our treatments include a renewable warranty that covers retreatment if termites return.' },
    ],
  },

  'termite-inspections': {
    heroTitle: 'Termite Inspections', heroHighlight: 'Termite Inspections',
    heroSubtitle: 'WDI reports for home sales — fast turnaround.',
    introHeading: 'Certified Wood-Destroying Insect Inspections',
    introP1: "Buying or selling a home? A Wood-Destroying Insect (WDI) inspection is required for most real estate transactions. Our licensed inspectors provide thorough, certified WDI reports with fast turnaround.",
    introP2: "Our inspections cover all wood-destroying insects including subterranean termites, drywood termites, carpenter ants, and wood-boring beetles — plus wood-destroying fungi and moisture conditions.",
    steps: [
      { title: 'Schedule', desc: 'Book your inspection online or by phone. Flexible scheduling including next-day appointments.' },
      { title: 'Inspect', desc: 'Licensed inspector performs thorough inspection of the entire structure per TPCL standards.' },
      { title: 'Report', desc: 'Official WDI report prepared with detailed findings, photos, and recommendations.' },
      { title: 'Deliver', desc: 'Report delivered within 24 hours — electronically or in print for your title company.' },
    ],
    faqs: [
      { q: 'Is a WDI inspection required for home sales?', a: 'Most lenders (especially VA and FHA) require a WDI inspection. It is strongly recommended for all home purchases.' },
      { q: 'How long does the inspection take?', a: 'A typical WDI inspection takes 45–90 minutes depending on the size and accessibility of the home.' },
      { q: 'How quickly will I get the report?', a: 'Reports are delivered within 24 hours. Rush delivery (same day) is available for urgent real estate closings.' },
      { q: 'What happens if termites are found?', a: 'The report will detail findings and recommend treatment. We can provide an estimate and begin treatment quickly to avoid delaying the sale.' },
      { q: 'Do you offer annual inspection plans?', a: 'Yes. Annual termite inspection plans for homeowners who want ongoing monitoring and peace of mind.' },
    ],
  },

  'spider-control': {
    heroTitle: 'Spider Control', heroHighlight: 'Spider Control',
    heroSubtitle: 'Fast, effective spider elimination — guaranteed.',
    introHeading: 'Expert Spider Control You Can Trust',
    introP1: "Black Widows and Brown Recluses hide in dark corners, closets, garages, and attics — often going unnoticed until someone gets bitten. Professional treatment provides lasting protection.",
    introP2: "Our licensed technicians identify entry points, treat harborage areas, and apply targeted residual treatments that eliminate spiders on contact and keep working for weeks.",
    steps: [
      { title: 'Inspect', desc: 'Thorough inspection of interior and exterior for webs, egg sacs, and harborage areas.' },
      { title: 'Treat', desc: 'Targeted application of EPA-approved residual treatments to baseboards, corners, and entry points.' },
      { title: 'Seal', desc: 'Identification and sealing of cracks, gaps, and entry points around the structure.' },
      { title: 'Monitor', desc: 'Follow-up inspection and quarterly maintenance to prevent re-infestation.' },
    ],
    faqs: [
      { q: 'How do I know if I have a spider infestation?', a: 'Look for webs in corners, around windows, in garages, and undisturbed areas. Seeing multiple spiders regularly indicates a problem.' },
      { q: 'Are your treatments safe for children and pets?', a: 'Yes, all products are EPA-approved and applied by licensed technicians.' },
      { q: 'How soon will I see results?', a: 'You may see spiders for 1–2 weeks as they contact treated areas. This is normal — most infestations resolve within 2–3 weeks.' },
      { q: 'Do you offer a guarantee?', a: 'Yes. If spiders return between scheduled services, we will retreat at no additional cost.' },
      { q: 'How often should I treat for spiders?', a: 'Quarterly treatments are recommended for ongoing protection year-round.' },
    ],
  },

  'bed-bug-control': {
    heroTitle: 'Bed Bug Extermination', heroHighlight: 'Bed Bug Extermination',
    heroSubtitle: 'Complete bed bug elimination — sleep tight again.',
    introHeading: 'Professional Bed Bug Treatment',
    introP1: "Bed bugs hide in mattress seams, box springs, headboards, and furniture cracks — coming out at night to feed. A single sighting means an infestation that will only grow without treatment.",
    introP2: "Our treatment uses proven methods including targeted chemical treatments to eliminate bed bugs at every life stage. We treat the entire room — mattress, box spring, furniture, baseboards, and outlets.",
    steps: [
      { title: 'Full Inspection', desc: 'Detailed inspection of mattresses, furniture, baseboards, and outlets to confirm bed bugs and assess severity.' },
      { title: 'Treatment', desc: 'Comprehensive treatment using targeted chemical application to eliminate all life stages.' },
      { title: 'Follow-Up', desc: 'Return visit at 2 weeks to treat any newly hatched bed bugs and verify elimination.' },
      { title: 'Prevention', desc: 'Guidance on mattress encasements, monitoring, and prevention to avoid re-infestation.' },
    ],
    faqs: [
      { q: 'Can I get bed bugs even if my home is clean?', a: 'Yes. Bed bugs hitchhike on luggage, clothing, and used furniture. Any home can get bed bugs.' },
      { q: 'How long does bed bug treatment take?', a: 'Chemical treatments take 2–3 hours per room. A follow-up visit at 2 weeks is included.' },
      { q: 'Do I need to throw away my mattress?', a: 'In most cases, no. Our treatments eliminate bed bugs from mattresses. We recommend encasements after treatment.' },
      { q: 'Can bed bugs spread to other rooms?', a: 'Yes. Bed bugs can travel through wall voids and electrical outlets. Early treatment prevents spreading.' },
      { q: 'How do I prevent bed bugs when traveling?', a: 'Inspect hotel beds before unpacking. Wash and dry all clothes on high heat after returning home.' },
    ],
  },

  'wasp-hornet-control': {
    heroTitle: 'Wasp & Hornet Control', heroHighlight: 'Wasp & Hornet Control',
    heroSubtitle: 'Safe removal of nests — we handle the dangerous work.',
    introHeading: 'Professional Wasp & Hornet Removal',
    introP1: "Wasps and hornets build nests under eaves, in attics, inside wall voids, and in trees. These stinging insects are aggressive when their nest is disturbed and can sting multiple times.",
    introP2: "Our technicians use professional protective equipment and specialized treatments to safely remove nests and eliminate wasp and hornet colonies. We apply residual treatments to prevent re-nesting.",
    steps: [
      { title: 'Locate', desc: 'Find all active nests around the structure, including hidden nests in walls and attics.' },
      { title: 'Equip', desc: 'Our technicians use full protective equipment for safe approach and treatment.' },
      { title: 'Treat & Remove', desc: 'Apply targeted insecticide directly to the nest, then remove it once all activity has stopped.' },
      { title: 'Prevent', desc: 'Apply residual treatments to common nesting sites to prevent wasps from rebuilding.' },
    ],
    faqs: [
      { q: 'Is it safe to remove a wasp nest myself?', a: 'We strongly recommend professional removal. Wasps can sting multiple times and may swarm. Allergic reactions can be life-threatening.' },
      { q: 'How quickly can you remove a wasp nest?', a: 'We offer same-day emergency service. Most jobs are completed in under an hour.' },
      { q: 'Will the wasps come back after treatment?', a: 'Our residual treatments prevent re-nesting at the same location. We also treat common nesting sites around your property.' },
      { q: 'Do you remove nests inside walls?', a: 'Yes. We can treat and remove nests inside wall voids, attics, and other hard-to-reach areas.' },
      { q: 'Are your treatments safe for my family?', a: 'Yes. We advise staying indoors during treatment and for 30 minutes after.' },
    ],
  },

  'scorpion-control': {
    heroTitle: 'Scorpion Control', heroHighlight: 'Scorpion Control',
    heroSubtitle: 'Protecting your family from scorpion stings.',
    introHeading: 'Expert Scorpion Treatment & Prevention',
    introP1: "Striped Bark Scorpions hide in shoes, bedding, closets, and dark areas during the day, then come out at night to hunt — putting your family at risk of painful stings.",
    introP2: "Our scorpion control program targets harborage sites inside and outside your home, applying long-lasting residual treatments to create a lethal barrier scorpions cannot survive.",
    steps: [
      { title: 'Inspect', desc: 'Inspect harborage sites including closets, garages, woodpiles, and foundation cracks using UV light.' },
      { title: 'Treat', desc: 'Apply residual treatments to interior baseboards, entry points, and exterior harborage areas.' },
      { title: 'Seal', desc: 'Identify and seal cracks, gaps under doors, and pipe penetrations that scorpions use to enter.' },
      { title: 'Barrier', desc: 'Ongoing barrier treatments around the foundation to prevent scorpion entry year-round.' },
    ],
    faqs: [
      { q: 'How dangerous are scorpion stings?', a: 'Striped bark scorpion stings are painful but rarely dangerous for healthy adults. However, stings can cause severe reactions in children and elderly. Seek medical attention if symptoms are severe.' },
      { q: 'How do scorpions get inside my house?', a: 'Scorpions enter through gaps under doors, cracks in the foundation, around pipe penetrations, and through weep holes. They can fit through openings as thin as a credit card.' },
      { q: 'Can I see scorpions at night?', a: 'Yes — scorpions glow under ultraviolet (black) light. Our technicians use UV flashlights during inspections.' },
      { q: 'How long does scorpion treatment last?', a: 'Our residual treatments provide protection for 60–90 days. Quarterly treatments are recommended for year-round protection.' },
      { q: 'Are scorpion treatments safe for pets?', a: 'Yes. Our treatments are EPA-approved and applied in targeted areas. Safe for pets once dry.' },
    ],
  },

  'flea-tick-control': {
    heroTitle: 'Flea & Tick Control', heroHighlight: 'Flea & Tick Control',
    heroSubtitle: 'Protect your family and pets from fleas and ticks.',
    introHeading: 'Comprehensive Flea & Tick Treatment',
    introP1: "Fleas and ticks thrive in warm, humid climates. These parasites feed on your pets and family, transmitting dangerous diseases including Lyme disease, Rocky Mountain spotted fever, and typhus.",
    introP2: "Our program treats both your home and yard simultaneously. We use insect growth regulators (IGRs) to break the flea life cycle indoors, combined with yard treatments that eliminate ticks and fleas outdoors.",
    steps: [
      { title: 'Inspect', desc: 'Indoor inspection to identify flea hotspots — pet bedding, carpets, furniture, and cracks.' },
      { title: 'Indoor Treatment', desc: 'Apply IGR + adulticide to carpets, baseboards, and pet areas to break the flea life cycle.' },
      { title: 'Outdoor Treatment', desc: 'Yard treatment targeting shaded areas, tall grass, and wooded edges where ticks and fleas breed.' },
      { title: 'Pet Guidance', desc: 'Recommend veterinary flea/tick prevention to complement our home and yard treatments.' },
    ],
    faqs: [
      { q: 'How quickly will flea treatment work?', a: 'You will see a significant reduction in flea activity within 24–48 hours. Flea pupae can continue emerging for 2–4 weeks, which is why follow-up treatment is important.' },
      { q: 'Do I need to treat my yard for fleas?', a: 'Yes. Fleas breed outdoors in shaded, moist areas. Treating only indoors results in re-infestation as fleas are carried back inside by pets.' },
      { q: 'Are flea treatments safe for my pets?', a: 'Yes. Our products are pet-safe once dry (typically 1–2 hours). Remove pets during application.' },
      { q: 'Will vacuuming help with fleas?', a: 'Yes. Frequent vacuuming removes flea eggs and larvae and stimulates pupae to emerge, making treatments more effective.' },
      { q: 'How often should I treat for fleas and ticks?', a: 'Every 4–6 weeks during peak season (spring through fall) for continuous protection.' },
    ],
  },
}

export const SERVICE_SLUGS = new Set(Object.keys(SERVICE_DATA))
