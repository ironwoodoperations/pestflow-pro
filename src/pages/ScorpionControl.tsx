import PestPageTemplate from '../components/PestPageTemplate'
import { PEST_VIDEOS } from '../data/pestVideos'

export default function ScorpionControl() {
  return (
    <PestPageTemplate
      pageSlug="scorpion-control"
      introImage="https://images.pexels.com/photos/3680934/pexels-photo-3680934.jpeg?auto=compress&w=800"
      videoUrl={PEST_VIDEOS.scorpion[0]?.url}
      heroTitle="Scorpion Control in East Texas"
      heroHighlight="Scorpion Control"
      heroSubtitle="Protecting East Texas families from scorpion stings."
      introHeading="Expert Scorpion Treatment & Prevention"
      introP1="The Striped Bark Scorpion is the most common scorpion in East Texas. These nocturnal arachnids hide in shoes, bedding, closets, and dark areas during the day, then come out at night to hunt — putting your family at risk of painful stings."
      introP2="Our scorpion control program targets harborage sites inside and outside your home. We apply long-lasting residual treatments to baseboards, entry points, and exterior hiding spots to create a lethal barrier scorpions cannot survive."
      introP3="If you've found scorpions in your home, there are likely more hiding nearby. Professional treatment is the fastest way to protect your family."
      steps={[
        { title: 'Inspect', desc: 'Inspect harborage sites including closets, garages, woodpiles, and foundation cracks using UV light.' },
        { title: 'Treat', desc: 'Apply residual treatments to interior baseboards, entry points, and exterior harborage areas.' },
        { title: 'Seal', desc: 'Identify and seal cracks, gaps under doors, and pipe penetrations that scorpions use to enter.' },
        { title: 'Barrier', desc: 'Ongoing barrier treatments around the foundation to prevent scorpion entry year-round.' },
      ]}
      specialSectionTitle="About East Texas Scorpions"
      specialCards={[
        { title: 'Striped Bark Scorpion', desc: 'The most common species in Texas. Yellowish-tan with dark stripes. Stings are painful but rarely life-threatening for healthy adults. Children and elderly are more at risk.' },
        { title: 'Nocturnal Behavior', desc: 'Scorpions are active at night and hide in dark, cool places during the day — shoes, piles of clothes, under rocks, and inside wall voids.' },
        { title: 'Prevention Tips', desc: 'Shake out shoes and clothes before wearing. Keep beds away from walls. Remove woodpiles and debris from around the foundation. Seal all entry points.' },
      ]}
      faqs={[
        { q: 'How dangerous are scorpion stings?', a: 'Striped bark scorpion stings are painful but rarely dangerous for healthy adults. However, stings can cause severe reactions in children, elderly, and those with allergies. Seek medical attention if symptoms are severe.' },
        { q: 'How do scorpions get inside my house?', a: 'Scorpions enter through gaps under doors, cracks in the foundation, around pipe penetrations, and through weep holes. They can fit through openings as thin as a credit card.' },
        { q: 'Can I see scorpions at night?', a: 'Yes — scorpions glow under ultraviolet (black) light. Our technicians use UV flashlights during inspections to find scorpions in and around your home.' },
        { q: 'How long does scorpion treatment last?', a: 'Our residual treatments provide protection for 60-90 days. We recommend quarterly treatments for year-round protection in scorpion-prone areas.' },
        { q: 'Are scorpion treatments safe for pets?', a: 'Yes. Our treatments are EPA-approved and applied in targeted areas. They are safe for pets and children once dry.' },
        { q: 'What should I do if I find a scorpion inside?', a: 'Carefully capture it under a glass and slide paper underneath, or use long tongs. Avoid reaching into dark areas without looking first. Call us for professional treatment.' },
      ]}
      eastTexasCTATitle="East Texas Scorpion Control Experts"
    />
  )
}
