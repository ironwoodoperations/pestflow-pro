/**
 * Seed default page_content rows for all 20 pages.
 *
 * USAGE:
 *   SUPABASE_URL=https://biezzykcgzkrwdgqpsar.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=your-key \
 *   TENANT_ID=e5d34055-2a35-4e48-8864-d9449cb9da43 \
 *   node scripts/seed-page-content.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const TENANT_ID = process.env.TENANT_ID

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !TENANT_ID) {
  console.error('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and TENANT_ID')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const PAGES = [
  { page_slug: 'home', title: "East Texas's Most Trusted Pest Control", subtitle: 'Licensed & insured professionals serving East Texas with fast, effective pest control.', intro: 'Protect your home and family from unwanted pests with our professional pest control services. Serving Tyler, Longview, and all of East Texas.' },
  { page_slug: 'spider-control', title: 'Spider Control in East Texas', subtitle: 'Fast, effective spider elimination — guaranteed.', intro: 'East Texas has multiple spider species including Black Widows and Brown Recluses that pose real risks. Our licensed technicians identify entry points, treat harborage areas, and apply targeted residual treatments.' },
  { page_slug: 'mosquito-control', title: 'Mosquito Control in East Texas', subtitle: 'Take back your yard — guaranteed mosquito reduction.', intro: "East Texas's warm climate and abundant standing water make it a breeding ground for mosquitoes. Our mosquito control program targets both adult mosquitoes and breeding sites." },
  { page_slug: 'ant-control', title: 'Ant Control in East Texas', subtitle: 'Eliminate fire ants, carpenter ants, and more.', intro: 'Ants are the #1 nuisance pest in East Texas. From painful fire ant stings to carpenter ants destroying wood structure, ant infestations require professional treatment.' },
  { page_slug: 'wasp-hornet-control', title: 'Wasp & Hornet Control in East Texas', subtitle: 'Safe removal of nests — we handle the dangerous work.', intro: 'Wasps and hornets build nests around East Texas homes — under eaves, in attics, inside wall voids, and in trees. Our technicians safely remove nests and eliminate colonies.' },
  { page_slug: 'roach-control', title: 'Cockroach Control in East Texas', subtitle: 'Complete roach elimination — inside and out.', intro: 'Cockroaches spread bacteria, trigger allergies, and contaminate food. Our cockroach control program uses gel baits, residual sprays, and crack-and-crevice treatments.' },
  { page_slug: 'flea-tick-control', title: 'Flea & Tick Control in East Texas', subtitle: 'Protect your family and pets from fleas and ticks.', intro: "Fleas and ticks thrive in East Texas's warm, humid climate. Our program treats both your home and yard simultaneously using insect growth regulators." },
  { page_slug: 'rodent-control', title: 'Rodent Control in East Texas', subtitle: 'Mice and rats eliminated — entry points sealed.', intro: 'Rodents cause extensive damage — chewing electrical wires, contaminating food, and spreading disease. Our program includes full exclusion, sealing every entry point.' },
  { page_slug: 'scorpion-control', title: 'Scorpion Control in East Texas', subtitle: 'Protecting East Texas families from scorpion stings.', intro: 'The Striped Bark Scorpion is common in East Texas. These nocturnal arachnids hide in shoes, bedding, and dark areas. Our treatments create a lethal barrier.' },
  { page_slug: 'bed-bug-control', title: 'Bed Bug Extermination in East Texas', subtitle: 'Complete bed bug elimination — sleep tight again.', intro: 'Bed bugs hide in mattress seams, box springs, and furniture cracks. Our treatment eliminates bed bugs at every life stage using targeted chemical or heat methods.' },
  { page_slug: 'pest-control', title: 'General Pest Control in East Texas', subtitle: 'One plan. All pests. Year-round protection.', intro: 'Our general pest control plans provide comprehensive protection against all common household pests with regular maintenance visits.' },
  { page_slug: 'termite-control', title: 'Termite Control in East Texas', subtitle: 'Stop termites before they destroy your home.', intro: 'Our termite control uses Termidor liquid barrier treatments and bait station systems to create a lethal zone around your home.' },
  { page_slug: 'termite-inspections', title: 'Termite Inspections in East Texas', subtitle: 'WDI reports for home sales — fast turnaround.', intro: 'Our licensed inspectors provide thorough, certified WDI reports covering termites, carpenter ants, wood-boring beetles, and wood-destroying fungi.' },
  { page_slug: 'about', title: 'About PestFlow Pro', subtitle: 'Protecting East Texas families and businesses since day one.', intro: 'We believe every family deserves a pest-free home. Our mission is to protect East Texas homes and businesses with safe, effective, and affordable pest control.' },
  { page_slug: 'faq', title: 'Frequently Asked Questions', subtitle: 'Everything you need to know about our pest control services.', intro: 'Find answers to common questions about our treatments, pricing, and service areas.' },
  { page_slug: 'contact', title: 'Contact Us', subtitle: 'Have a question or need service? We are here to help.', intro: 'Reach out to us by phone, email, or fill out the contact form. We respond to all inquiries within 2 hours during business hours.' },
  { page_slug: 'quote', title: 'Get a Free Quote', subtitle: 'Complete these quick steps and we will get back to you fast.', intro: 'Request a free, no-obligation pest control quote. Same-day service available for most pest issues.' },
  { page_slug: 'reviews', title: 'What Our Customers Say', subtitle: 'Real reviews from real East Texas customers.', intro: 'Read what our customers have to say about our pest control services.' },
  { page_slug: 'service-area', title: 'Our East Texas Service Area', subtitle: 'We proudly serve Tyler, TX and surrounding communities.', intro: 'Professional pest control serving Tyler, Longview, Jacksonville, Lindale, Bullard, Whitehouse and all of East Texas within 50 miles.' },
  { page_slug: 'blog', title: 'Pest Control Blog', subtitle: 'Tips, guides, and news from our East Texas pest control experts.', intro: 'Stay informed with the latest pest control tips, seasonal alerts, and expert advice for East Texas homeowners.' },
]

let count = 0
for (const page of PAGES) {
  const { error } = await supabase.from('page_content').upsert(
    { tenant_id: TENANT_ID, ...page },
    { onConflict: 'tenant_id,page_slug' }
  )
  if (error) console.warn(`  ✗ ${page.page_slug}: ${error.message}`)
  else { count++; console.log(`  ✓ ${page.page_slug}`) }
}

console.log(`\n✅ Seeded ${count}/${PAGES.length} pages for tenant ${TENANT_ID}`)
