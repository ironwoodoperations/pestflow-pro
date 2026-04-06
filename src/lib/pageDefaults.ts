// Default page content for all 15 page slugs.
// Used as fallback when page_content DB row is null/empty.
// These are the same strings previously hardcoded in shell templates and page components.

export interface PageContent {
  title: string
  subtitle: string
  intro: string
  video_url?: string
  image_url?: string
  image_urls?: string[]
}

export const PAGE_DEFAULTS: Record<string, PageContent> = {
  'home': {
    title: 'Professional Pest Control You Can Trust',
    subtitle: 'Licensed & insured professionals. Fast, effective results.',
    intro: '',
    image_url: '/images/pests/pest_control.jpg',
  },
  'about': {
    title: 'About Us',
    subtitle: 'Locally owned and operated.',
    intro: 'We are a locally owned pest control company dedicated to protecting homes and businesses with science-backed solutions, transparent pricing, and guaranteed results.',
    image_url: '/images/pests/tech_1.jpg',
  },
  'pest-control': {
    title: 'General Pest Control in East Texas',
    subtitle: 'One plan. All pests. Year-round protection.',
    intro: 'East Texas is home to dozens of pest species that invade homes year-round. Our general pest control plans provide comprehensive protection against all common household pests with regular maintenance visits.',
    image_url: '/images/pests/pest_control.jpg',
  },
  'termite-control': {
    title: 'Termite Control in East Texas',
    subtitle: 'Stop termites before they destroy your home.',
    intro: 'Termites cause over $5 billion in property damage annually in the United States, and East Texas\'s warm, humid climate makes it one of the highest-risk areas. Our termite control program uses industry-leading treatments to eliminate colonies completely.',
    image_url: '/images/pests/termite_control.jpg',
  },
  'termite-inspections': {
    title: 'Termite Inspections in East Texas',
    subtitle: 'WDI reports for home sales — fast turnaround.',
    intro: 'Buying or selling a home in East Texas? A Wood-Destroying Insect (WDI) inspection is required for most real estate transactions in Texas. Our licensed inspectors provide thorough, certified WDI reports with fast turnaround.',
    image_url: '/images/pests/termite_inspection.jpg',
  },
  'roach-control': {
    title: 'Cockroach Control in East Texas',
    subtitle: 'Complete roach elimination — inside and out.',
    intro: 'Cockroaches are one of the most resilient pests in East Texas. They spread bacteria, trigger allergies and asthma, and contaminate food. A single cockroach sighting usually means dozens more are hiding in walls, cabinets, and appliances.',
    image_url: '/images/pests/roach.jpg',
  },
  'ant-control': {
    title: 'Ant Control in East Texas',
    subtitle: 'Eliminate fire ants, carpenter ants, and more.',
    intro: 'Ants are the #1 nuisance pest in East Texas. From painful fire ant stings in your yard to carpenter ants destroying your home\'s wood structure, ant infestations require professional treatment to fully eliminate.',
    image_url: '/images/pests/ant.jpg',
  },
  'mosquito-control': {
    title: 'Mosquito Control in East Texas',
    subtitle: 'Take back your yard — guaranteed mosquito reduction.',
    intro: 'East Texas\'s warm climate and abundant standing water make it a breeding ground for mosquitoes. These pests carry dangerous diseases including West Nile virus, Zika, and encephalitis — making professional mosquito control essential.',
    image_url: '/images/pests/Mosquito.jpg',
  },
  'bed-bug-control': {
    title: 'Bed Bug Extermination in East Texas',
    subtitle: 'Complete bed bug elimination — sleep tight again.',
    intro: 'Bed bugs are expert hitchhikers that can infest any home regardless of cleanliness. They hide in mattress seams, box springs, headboards, and furniture cracks — coming out at night to feed on your blood while you sleep.',
    image_url: '/images/pests/bed_bug.jpg',
  },
  'flea-tick-control': {
    title: 'Flea & Tick Control in East Texas',
    subtitle: 'Protect your family and pets from fleas and ticks.',
    intro: 'Fleas and ticks thrive in East Texas\'s warm, humid climate. These parasites feed on your pets and family, transmitting dangerous diseases including Lyme disease, Rocky Mountain spotted fever, and typhus.',
    image_url: '/images/pests/flea_tik.jpg',
  },
  'rodent-control': {
    title: 'Rodent Control in East Texas',
    subtitle: 'Mice and rats eliminated — entry points sealed.',
    intro: 'Rodents cause extensive damage to East Texas homes — chewing electrical wires (fire hazard), contaminating food, spreading disease, and creating unsanitary nesting areas in your attic, walls, and crawlspace.',
    image_url: '/images/pests/rodent.jpg',
  },
  'scorpion-control': {
    title: 'Scorpion Control in East Texas',
    subtitle: 'Protecting East Texas families from scorpion stings.',
    intro: 'The Striped Bark Scorpion is the most common scorpion in East Texas. These nocturnal arachnids hide in shoes, bedding, closets, and dark areas during the day, then come out at night to hunt.',
    image_url: '/images/pests/scorpion.jpg',
  },
  'contact': {
    title: 'Contact Us',
    subtitle: 'Have a question or need service? We\'re here to help.',
    intro: '',
  },
  'faq': {
    title: 'Frequently Asked Questions',
    subtitle: 'Everything you need to know about our pest control services.',
    intro: '',
  },
  'quote': {
    title: 'Get a Free Quote',
    subtitle: 'Complete these 4 quick steps and we\'ll get back to you fast.',
    intro: '',
  },
}
