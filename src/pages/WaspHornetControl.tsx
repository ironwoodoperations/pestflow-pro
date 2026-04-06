import PestPageTemplate from '../components/PestPageTemplate'
import { PEST_VIDEOS } from '../data/pestVideos'

export default function WaspHornetControl() {
  return (
    <PestPageTemplate
      pageSlug="wasp-hornet-control"
      introImage="/images/pests/wasp_hornet.jpg"
      videoUrl={PEST_VIDEOS.wasp[0]?.url}
      heroTitle="Wasp & Hornet Control in East Texas"
      heroHighlight="Wasp & Hornet Control"
      heroSubtitle="Safe removal of nests — we handle the dangerous work."
      introHeading="Professional Wasp & Hornet Removal"
      introP1="Wasps and hornets build nests around East Texas homes — under eaves, in attics, inside wall voids, and in trees. These stinging insects are aggressive when their nest is disturbed and can sting multiple times, posing serious risks to allergic individuals."
      introP2="Our technicians use professional protective equipment and specialized treatments to safely remove nests and eliminate wasp and hornet colonies. We treat the nest directly and apply residual treatments to prevent re-nesting."
      introP3="Don't risk getting stung trying to remove a nest yourself. Our professional wasp and hornet removal is fast, safe, and guaranteed."
      steps={[
        { title: 'Locate', desc: 'Find all active nests around the structure, including hidden nests in walls and attics.' },
        { title: 'Equip', desc: 'Our technicians use full protective equipment for safe approach and treatment.' },
        { title: 'Treat & Remove', desc: 'Apply targeted insecticide directly to the nest, then remove it once all activity has stopped.' },
        { title: 'Prevent', desc: 'Apply residual treatments to common nesting sites to prevent wasps from rebuilding.' },
      ]}
      specialSectionTitle="Types of Stinging Insects We Remove"
      specialCards={[
        { title: 'Yellow Jackets', desc: 'Aggressive wasps that nest in the ground and wall voids. Highly territorial and will sting repeatedly if their nest is disturbed.' },
        { title: 'Paper Wasps', desc: 'Build open, umbrella-shaped nests under eaves, porches, and deck railings. Less aggressive but will sting if threatened.' },
        { title: 'Bald-Faced Hornets', desc: 'Large black and white hornets that build football-sized paper nests in trees and on structures. Extremely aggressive near their nest.' },
      ]}
      faqs={[
        { q: 'Is it safe to remove a wasp nest myself?', a: 'We strongly recommend professional removal. Wasps can sting multiple times and may swarm when their nest is disturbed. Allergic reactions can be life-threatening.' },
        { q: 'How quickly can you remove a wasp nest?', a: 'We offer same-day emergency service for wasp and hornet removal. Most jobs are completed in under an hour.' },
        { q: 'Will the wasps come back after treatment?', a: 'Our residual treatments prevent re-nesting at the same location. We also treat common nesting sites around your property to discourage new colonies.' },
        { q: 'What time of year are wasps most active?', a: 'Wasps are most active from spring through fall in East Texas. Colonies are largest and most aggressive in late summer and early fall.' },
        { q: 'Do you remove nests inside walls?', a: 'Yes. We can treat and remove nests inside wall voids, attics, and other hard-to-reach areas using specialized equipment.' },
        { q: 'Are your treatments safe for my family?', a: 'Yes. All products are EPA-approved and applied by licensed technicians. We advise staying indoors during treatment and for 30 minutes after.' },
      ]}
      eastTexasCTATitle="East Texas Wasp & Hornet Removal Experts"
    />
  )
}
