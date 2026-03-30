import PestPageTemplate from '../components/PestPageTemplate'

export default function BedBugControl() {
  return (
    <PestPageTemplate
      pageSlug="bed-bug-control"
      introImage="/images/pests/bedbug.jpg"
      heroTitle="Bed Bug Extermination in East Texas"
      heroHighlight="Bed Bug Extermination"
      heroSubtitle="Complete bed bug elimination — sleep tight again."
      introHeading="Professional Bed Bug Treatment"
      introP1="Bed bugs are expert hitchhikers that can infest any home regardless of cleanliness. They hide in mattress seams, box springs, headboards, and furniture cracks — coming out at night to feed on your blood while you sleep."
      introP2="Our bed bug treatment uses proven methods including targeted chemical treatments and heat options to eliminate bed bugs at every life stage. We treat the entire room — mattress, box spring, furniture, baseboards, and outlets."
      introP3="Bed bug infestations get worse over time, not better. Early treatment is essential. If you're waking up with itchy bites or finding blood spots on your sheets, call us immediately."
      steps={[
        { title: 'Full Inspection', desc: 'Detailed inspection of mattresses, furniture, baseboards, and outlets to confirm bed bugs and assess severity.' },
        { title: 'Treatment', desc: 'Comprehensive treatment using targeted chemical application or heat treatment to eliminate all life stages.' },
        { title: 'Follow-Up', desc: 'Return visit at 2 weeks to treat any newly hatched bed bugs and verify elimination.' },
        { title: 'Prevention', desc: 'Guidance on mattress encasements, monitoring, and prevention to avoid re-infestation.' },
      ]}
      specialSectionTitle="Do You Have Bed Bugs? Warning Signs"
      specialCards={[
        { title: 'Bites & Blood Stains', desc: 'Itchy red bites in rows or clusters on exposed skin. Small blood stains on sheets and pillowcases from crushed bed bugs.' },
        { title: 'Dark Spots & Shed Skins', desc: 'Dark fecal spots (like ink dots) on mattress seams and nearby surfaces. Translucent shed skins from growing bed bugs.' },
        { title: 'Musty Odor', desc: 'A sweet, musty odor in heavily infested rooms from bed bug scent glands. Often described as smelling like coriander or overripe raspberries.' },
      ]}
      faqs={[
        { q: 'Can I get bed bugs even if my home is clean?', a: 'Yes. Bed bugs are not attracted to dirt. They hitchhike on luggage, clothing, used furniture, and other items. Any home can get bed bugs.' },
        { q: 'How do bed bug heat treatments work?', a: 'We raise the room temperature to 130°F+ for several hours, which kills bed bugs and eggs at all life stages. Heat penetrates mattresses, furniture, and wall voids where chemicals cannot reach.' },
        { q: 'How long does bed bug treatment take?', a: 'Chemical treatments take 2-3 hours per room. Heat treatments take 6-8 hours. A follow-up visit at 2 weeks is included.' },
        { q: 'Do I need to throw away my mattress?', a: 'In most cases, no. Our treatments eliminate bed bugs from mattresses. We recommend mattress encasements after treatment for added protection.' },
        { q: 'Can bed bugs spread to other rooms?', a: 'Yes. Bed bugs can travel through wall voids, electrical outlets, and on clothing. Early treatment prevents spreading. We inspect adjacent rooms as part of our service.' },
        { q: 'How do I prevent bed bugs when traveling?', a: 'Inspect hotel beds before unpacking. Keep luggage on metal racks, not the bed or floor. Wash and dry all clothes on high heat after returning home.' },
      ]}
      eastTexasCTATitle="East Texas Bed Bug Extermination Experts"
    />
  )
}
