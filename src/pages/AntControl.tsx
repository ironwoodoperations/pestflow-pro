import PestPageTemplate from '../components/PestPageTemplate'
import { PEST_VIDEOS } from '../data/pestVideos'

export default function AntControl() {
  return (
    <PestPageTemplate
      pageSlug="ant-control"
      introImage="/images/pests/ant.jpg"
      videoUrl={PEST_VIDEOS.ant[0]?.url}
      heroTitle="Ant Control in East Texas"
      heroHighlight="Ant Control"
      heroSubtitle="Eliminate fire ants, carpenter ants, and more."
      introHeading="Effective Ant Control Solutions"
      introP1="Ants are the #1 nuisance pest in East Texas. From painful fire ant stings in your yard to carpenter ants destroying your home's wood structure, ant infestations require professional treatment to fully eliminate."
      introP2="Our ant control program starts with identifying the species, then targets the colony at its source. We use a combination of baits, direct nest treatments, and perimeter barriers to eliminate existing colonies and prevent new ones."
      introP3="Don't waste money on DIY sprays that only kill the ants you see. Our professional treatments reach the queen and destroy the entire colony for lasting results."
      steps={[
        { title: 'Identify', desc: 'Determine ant species and locate colony entry points, trails, and nesting sites.' },
        { title: 'Bait & Treat', desc: 'Apply targeted bait systems and direct colony treatments to eliminate the queen and workers.' },
        { title: 'Barrier', desc: 'Create an exterior perimeter barrier to prevent new colonies from establishing.' },
        { title: 'Follow Up', desc: 'Follow-up inspection to verify elimination and treat any remaining activity.' },
      ]}
      specialSectionTitle="Ant Species We Treat"
      specialCards={[
        { title: 'Fire Ants', desc: 'Aggressive red ants with painful stings. Build large mound colonies in yards. Dangerous to children, pets, and people with allergies.' },
        { title: 'Carpenter Ants', desc: 'Large black ants that tunnel through wood, causing structural damage similar to termites. Often found in moist wood areas.' },
        { title: 'Odorous House Ants', desc: 'Small brown ants that invade kitchens and bathrooms. Named for the rotten coconut smell they produce when crushed.' },
      ]}
      faqs={[
        { q: 'Why do ants keep coming back after I spray?', a: 'Over-the-counter sprays only kill ants on contact. The queen keeps producing new workers. Professional baits are carried back to the colony, killing the queen and the entire nest.' },
        { q: 'How long does ant treatment take to work?', a: 'Bait treatments take 1-2 weeks to fully eliminate a colony as workers carry the bait back to the queen. You may see increased activity initially — this means the bait is working.' },
        { q: 'Are fire ant treatments safe for my lawn?', a: 'Yes. Our fire ant treatments are granular baits that are safe for lawns, gardens, and areas where children and pets play.' },
        { q: 'Do carpenter ants cause as much damage as termites?', a: 'Carpenter ants can cause significant structural damage over time, though they work slower than termites. They hollow out wood for nesting but do not eat it.' },
        { q: 'How do I prevent ants from coming inside?', a: 'Keep food sealed, fix moisture issues, trim vegetation away from the house, and maintain a professional perimeter barrier treatment.' },
        { q: 'Do you offer a guarantee on ant treatments?', a: 'Yes, we guarantee our ant treatments. If ants return between scheduled services, we will retreat at no additional cost.' },
      ]}
      eastTexasCTATitle="East Texas Ant Control Experts"
    />
  )
}
