import PestPageTemplate from '../components/PestPageTemplate'

export default function MosquitoControl() {
  return (
    <PestPageTemplate
      pageSlug="mosquito-control"
      introImage="https://images.pexels.com/photos/1000067/pexels-photo-1000067.jpeg?w=800"
      heroTitle="Mosquito Control in East Texas"
      heroHighlight="Mosquito Control"
      heroSubtitle="Take back your yard — guaranteed mosquito reduction."
      introHeading="East Texas Mosquito Experts"
      introP1="East Texas's warm climate and abundant standing water make it a breeding ground for mosquitoes. These pests carry dangerous diseases including West Nile virus, Zika, and encephalitis — making professional mosquito control essential for your family's safety."
      introP2="Our mosquito control program targets both adult mosquitoes and breeding sites. We use a combination of barrier sprays, larvicide treatments, and automatic misting systems to dramatically reduce mosquito populations on your property."
      introP3="Whether you need a one-time treatment for an event or ongoing monthly service, our licensed technicians have the tools and expertise to give you back your outdoor living space."
      steps={[
        { title: 'Inspect', desc: 'Identify all breeding sites including standing water, clogged gutters, and low-lying areas.' },
        { title: 'Treat', desc: 'Apply barrier spray to foliage and treat standing water with EPA-approved larvicide.' },
        { title: 'Install', desc: 'Recommend and install automatic misting systems for continuous protection.' },
        { title: 'Maintain', desc: 'Monthly maintenance visits to reapply treatments and inspect for new breeding sites.' },
      ]}
      specialSectionTitle="Our Mosquito Misting System"
      specialCards={[
        { title: 'Automatic Protection', desc: 'Our misting systems release a fine mist of EPA-approved insecticide at programmed intervals, providing 24/7 mosquito protection without any effort on your part.' },
        { title: 'Custom Installation', desc: 'Systems are custom-designed for your property with nozzles strategically placed around your yard perimeter, patio, and outdoor living areas.' },
        { title: 'Ongoing Support', desc: 'We handle refills, maintenance, and seasonal adjustments. Remote control options let you trigger extra misting before outdoor events.' },
      ]}
      faqs={[
        { q: 'How effective is professional mosquito control?', a: 'Our treatments typically reduce mosquito populations by 85-90% on your property. Monthly treatments maintain this level of protection throughout mosquito season.' },
        { q: 'Are mosquito treatments safe for my pets?', a: 'Yes. Once the treatment dries (typically 30 minutes), it is safe for pets and children. We use EPA-approved products applied by licensed technicians.' },
        { q: 'How often should I treat for mosquitoes?', a: 'Monthly treatments are recommended during mosquito season (March through November in East Texas) for continuous protection.' },
        { q: 'Do you treat for mosquito larvae?', a: 'Yes. We treat all standing water sources with larvicide to prevent mosquitoes from breeding on your property.' },
        { q: 'Can I get a one-time treatment for an event?', a: 'Absolutely. We offer one-time barrier treatments ideal for weddings, parties, and other outdoor events. Treatments should be applied 24-48 hours before your event.' },
        { q: 'What is the cost of a misting system?', a: 'Misting system costs vary based on property size and number of nozzles needed. Contact us for a free estimate tailored to your property.' },
      ]}
      eastTexasCTATitle="East Texas Mosquito Control Experts"
    />
  )
}
