import PestPageTemplate from '../components/PestPageTemplate'
import { PEST_VIDEOS } from '../data/pestVideos'

export default function RoachControl() {
  return (
    <PestPageTemplate
      pageSlug="roach-control"
      introImage="https://images.pexels.com/photos/4439425/pexels-photo-4439425.jpeg?w=800"
      videoUrl={PEST_VIDEOS.roach[0]?.url}
      heroTitle="Cockroach Control in East Texas"
      heroHighlight="Cockroach Control"
      heroSubtitle="Complete roach elimination — inside and out."
      introHeading="Expert Cockroach Extermination"
      introP1="Cockroaches are one of the most resilient pests in East Texas. They spread bacteria, trigger allergies and asthma, and contaminate food. A single cockroach sighting usually means dozens more are hiding in walls, cabinets, and appliances."
      introP2="Our cockroach control program uses gel baits, residual sprays, and crack-and-crevice treatments to eliminate roaches at every life stage — eggs, nymphs, and adults. We target harborage areas where roaches hide and breed."
      introP3="Whether you're dealing with small German cockroaches in the kitchen or large American cockroaches from outside, our treatments are proven effective and backed by our satisfaction guarantee."
      steps={[
        { title: 'Inspect', desc: 'Thorough inspection of kitchens, bathrooms, and all harborage areas to assess infestation severity.' },
        { title: 'Bait & Spray', desc: 'Apply gel bait in cracks and crevices combined with residual spray in harborage areas.' },
        { title: 'Crack & Crevice', desc: 'Targeted treatment of wall voids, baseboards, and pipe penetrations where roaches hide.' },
        { title: 'Prevent', desc: 'Follow-up treatment and sanitation recommendations to prevent re-infestation.' },
      ]}
      specialSectionTitle="Roach Species We Eliminate"
      specialCards={[
        { title: 'German Cockroach', desc: 'Small, light brown roaches that infest kitchens and bathrooms. Reproduce rapidly — a single female can produce 300+ offspring in her lifetime.' },
        { title: 'American Cockroach', desc: 'Large reddish-brown roaches (up to 2 inches) commonly called "water bugs." Enter from outside through drains, gaps, and doors.' },
        { title: 'Oriental Cockroach', desc: 'Dark, shiny roaches that prefer cool, damp areas like basements and crawlspaces. Strong, musty odor indicates their presence.' },
      ]}
      faqs={[
        { q: 'Why do I keep seeing roaches even after spraying?', a: 'DIY sprays only kill roaches on contact and can actually scatter them to new areas. Professional gel baits are carried back to the nest, eliminating the entire population over 1-2 weeks.' },
        { q: 'How long does cockroach treatment take?', a: 'Initial treatment takes 60-90 minutes. You will see a significant reduction within the first week, with full elimination typically within 2-3 weeks.' },
        { q: 'Do I need to leave my home during treatment?', a: 'No. Our treatments are applied in targeted areas and are safe for occupied homes. We will advise you of any specific precautions for your treatment plan.' },
        { q: 'Are cockroaches dangerous to my health?', a: 'Yes. Cockroaches spread salmonella, E. coli, and other bacteria. Their droppings and shed skins trigger allergies and asthma, especially in children.' },
        { q: 'How can I prevent cockroaches?', a: 'Keep your home clean, store food in sealed containers, fix leaky pipes, seal cracks around pipes and doors, and maintain regular professional pest control.' },
        { q: 'Do you guarantee roach elimination?', a: 'Yes. We guarantee our cockroach treatments. If roaches return between services, we retreat at no additional cost.' },
      ]}
      eastTexasCTATitle="East Texas Cockroach Control Experts"
    />
  )
}
