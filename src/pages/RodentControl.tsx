import PestPageTemplate from '../components/PestPageTemplate'

export default function RodentControl() {
  return (
    <PestPageTemplate
      pageSlug="rodent-control"
      introImage="/images/pests/rodent.jpg"
      heroTitle="Rodent Control in East Texas"
      heroHighlight="Rodent Control"
      heroSubtitle="Mice and rats eliminated — entry points sealed."
      introHeading="Professional Rodent Extermination & Exclusion"
      introP1="Rodents cause extensive damage to East Texas homes — chewing electrical wires (fire hazard), contaminating food, spreading disease, and creating unsanitary nesting areas in your attic, walls, and crawlspace."
      introP2="Our rodent control program goes beyond trapping. We perform a full exclusion — sealing every entry point mice and rats use to enter your home. A mouse can fit through a hole the size of a dime, so thorough exclusion is critical."
      introP3="If you hear scratching in the walls or attic, find droppings in cabinets, or notice gnaw marks on food packaging, you likely have a rodent problem that needs immediate attention."
      steps={[
        { title: 'Full Inspection', desc: 'Inspect attic, crawlspace, exterior foundation, and roof for entry points, droppings, and nesting.' },
        { title: 'Bait & Trap', desc: 'Strategic placement of bait stations and traps in activity areas for rapid population reduction.' },
        { title: 'Exclusion', desc: 'Seal all entry points with steel wool, metal flashing, and professional-grade exclusion materials.' },
        { title: 'Sanitation', desc: 'Guidance on removing nesting materials, cleaning contaminated areas, and preventing re-entry.' },
      ]}
      specialSectionTitle="Signs You Have a Rodent Problem"
      specialCards={[
        { title: 'Droppings & Gnaw Marks', desc: 'Small dark droppings along baseboards, in cabinets, or in the attic. Gnaw marks on food packaging, wires, and wood indicate active rodent activity.' },
        { title: 'Scratching & Nesting', desc: 'Scratching sounds in walls or ceiling at night. Shredded paper, insulation, or fabric indicates nesting material collection.' },
        { title: 'Grease Marks & Odor', desc: 'Dark grease marks along walls where rodents travel repeatedly. Strong musty or ammonia odor from urine accumulation in nesting areas.' },
      ]}
      faqs={[
        { q: 'How do mice get into my house?', a: 'Mice can fit through openings as small as a dime. Common entry points include gaps around pipes, AC lines, dryer vents, garage doors, and foundation cracks.' },
        { q: 'Are rodent droppings dangerous?', a: 'Yes. Rodent droppings can carry hantavirus, salmonella, and other pathogens. Always wear gloves and a mask when cleaning, or let professionals handle it.' },
        { q: 'How long does rodent exclusion take?', a: 'A typical exclusion takes 2-4 hours depending on the number of entry points. Trapping and monitoring continue for 2-4 weeks to ensure the problem is fully resolved.' },
        { q: 'Will poison kill rodents in my walls?', a: 'We prefer trapping over poison inside homes because poisoned rodents can die in wall voids, causing odor issues. Bait stations are used strategically around the exterior.' },
        { q: 'Do you clean up rodent contamination?', a: 'We provide guidance on safe cleanup procedures. For major contamination (attic insulation, etc.), we can recommend restoration partners.' },
        { q: 'How can I prevent rodents from returning?', a: 'Professional exclusion is the most effective prevention. Also keep vegetation trimmed away from the house, store food in sealed containers, and eliminate water sources.' },
      ]}
      eastTexasCTATitle="East Texas Rodent Control Experts"
    />
  )
}
