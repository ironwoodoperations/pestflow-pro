import PestPageTemplate from '../components/PestPageTemplate'
import { PEST_VIDEOS } from '../data/pestVideos'

export default function TermiteControl() {
  return (
    <PestPageTemplate
      pageSlug="termite-control"
      introImage="/images/pests/termite_control.jpg"
      videoUrl={PEST_VIDEOS.termite[0]?.url}
      heroTitle="Termite Control in East Texas"
      heroHighlight="Termite Control"
      heroSubtitle="Stop termites before they destroy your home."
      introHeading="Professional Termite Extermination"
      introP1="Termites cause over $5 billion in property damage annually in the United States, and East Texas's warm, humid climate makes it one of the highest-risk areas. Subterranean termites can silently eat through your home's structure for years before you notice."
      introP2="Our termite control program uses industry-leading liquid barrier treatments (Termidor) and bait station systems to create a lethal zone around your home. Termites that contact treated soil carry the product back to the colony, eliminating it completely."
      introP3="Don't wait until you see damage. If your home hasn't been inspected for termites in the past year, schedule an inspection today. Early detection saves thousands in repair costs."
      steps={[
        { title: 'Inspection', desc: 'Thorough termite inspection of foundation, crawlspace, attic, and exterior for signs of activity.' },
        { title: 'Liquid Barrier', desc: 'Termidor liquid barrier treatment around the entire foundation, creating a lethal zone termites cannot detect.' },
        { title: 'Bait Stations', desc: 'Installation of monitoring bait stations around the perimeter for ongoing detection and colony elimination.' },
        { title: 'Annual Monitoring', desc: 'Annual inspection and bait station monitoring to ensure continued protection.' },
      ]}
      specialSectionTitle="Signs of Termite Damage"
      specialCards={[
        { title: 'Mud Tubes & Hollow Wood', desc: 'Pencil-thin mud tubes running up foundation walls. Wood that sounds hollow when tapped. These are signs of active subterranean termite infestation.' },
        { title: 'Discarded Wings & Swarmers', desc: 'Piles of discarded wings near windows and doors after a termite swarm event. Swarmers (flying termites) indicate a mature colony nearby.' },
        { title: 'Bubbling Paint & Tight Doors', desc: 'Paint that appears bubbled or uneven. Doors and windows that suddenly stick or won\'t close properly due to termite damage warping the frame.' },
      ]}
      faqs={[
        { q: 'How do I know if I have termites?', a: 'Look for mud tubes on foundation walls, hollow-sounding wood, discarded wings near windows, and bubbling paint. However, termites often go undetected — annual professional inspections are essential.' },
        { q: 'What is Termidor treatment?', a: 'Termidor is the #1 termite defense product worldwide. It is applied as a liquid barrier around your foundation. Termites cannot detect it, so they walk through it and transfer it to other colony members, eliminating the entire colony.' },
        { q: 'How long does termite treatment last?', a: 'Termidor liquid barrier treatments provide protection for 5-10+ years. Bait stations provide continuous monitoring and protection with annual service.' },
        { q: 'Is termite damage covered by insurance?', a: 'Most homeowner insurance policies do NOT cover termite damage. This makes prevention and early detection critical. Annual inspections are your best protection.' },
        { q: 'How much does termite treatment cost?', a: 'Costs depend on your home size, construction type, and severity of infestation. Contact us for a free inspection and estimate.' },
        { q: 'Do you offer a termite warranty?', a: 'Yes. Our termite treatments include a renewable warranty that covers retreatment if termites return. Ask about our warranty terms during your free inspection.' },
      ]}
      eastTexasCTATitle="East Texas Termite Control Experts"
    />
  )
}
