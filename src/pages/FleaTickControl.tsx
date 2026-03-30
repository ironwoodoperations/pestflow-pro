import PestPageTemplate from '../components/PestPageTemplate'

export default function FleaTickControl() {
  return (
    <PestPageTemplate
      pageSlug="flea-tick-control"
      introImage="https://images.pexels.com/photos/4239013/pexels-photo-4239013.jpeg?w=800"
      heroTitle="Flea & Tick Control in East Texas"
      heroHighlight="Flea & Tick Control"
      heroSubtitle="Protect your family and pets from fleas and ticks."
      introHeading="Comprehensive Flea & Tick Treatment"
      introP1="Fleas and ticks thrive in East Texas's warm, humid climate. These parasites feed on your pets and family, transmitting dangerous diseases including Lyme disease, Rocky Mountain spotted fever, and typhus."
      introP2="Our flea and tick program treats both your home and yard simultaneously. We use insect growth regulators (IGRs) to break the flea life cycle indoors, combined with yard treatments that eliminate ticks and fleas in outdoor areas where they breed."
      introP3="If your pets are scratching or you're finding bites on your ankles, don't wait — flea populations can explode rapidly. One female flea lays up to 50 eggs per day."
      steps={[
        { title: 'Inspect', desc: 'Indoor inspection to identify flea hotspots — pet bedding, carpets, furniture, and cracks.' },
        { title: 'Indoor Treatment', desc: 'Apply IGR + adulticide to carpets, baseboards, and pet areas to break the flea life cycle.' },
        { title: 'Outdoor Treatment', desc: 'Yard treatment targeting shaded areas, tall grass, and wooded edges where ticks and fleas breed.' },
        { title: 'Pet Guidance', desc: 'Recommend veterinary flea/tick prevention to complement our home and yard treatments.' },
      ]}
      specialSectionTitle="Diseases Ticks Carry in East Texas"
      specialCards={[
        { title: 'Lyme Disease', desc: 'Transmitted by blacklegged ticks. Causes fever, fatigue, and a characteristic bullseye rash. Can lead to chronic joint and neurological problems if untreated.' },
        { title: 'Rocky Mountain Spotted Fever', desc: 'Transmitted by the American dog tick. Causes high fever, headache, and spotted rash. Can be fatal without prompt antibiotic treatment.' },
        { title: 'Ehrlichiosis', desc: 'Transmitted by lone star ticks, common in East Texas. Causes fever, muscle aches, and fatigue. Affects both humans and dogs.' },
      ]}
      faqs={[
        { q: 'How quickly will flea treatment work?', a: 'You will see a significant reduction in flea activity within 24-48 hours. However, flea pupae can continue to emerge for 2-4 weeks, which is why follow-up treatment is important.' },
        { q: 'Do I need to treat my yard for fleas?', a: 'Yes. Fleas breed outdoors in shaded, moist areas. Treating only indoors will result in re-infestation as fleas are carried back inside by pets.' },
        { q: 'Are flea treatments safe for my pets?', a: 'Yes. Our products are pet-safe once dry (typically 1-2 hours). We recommend removing pets during application and keeping them off treated surfaces until dry.' },
        { q: 'How do I know if I have fleas or bed bugs?', a: 'Flea bites are typically on ankles and lower legs and appear as small red dots. Bed bug bites are usually in lines on the upper body. We can inspect and identify the pest.' },
        { q: 'Will vacuuming help with fleas?', a: 'Yes. Frequent vacuuming removes flea eggs and larvae from carpets and stimulates flea pupae to emerge, making treatments more effective. Dispose of vacuum bags after each use.' },
        { q: 'How often should I treat for fleas and ticks?', a: 'We recommend treatments every 4-6 weeks during peak season (spring through fall) for continuous protection.' },
      ]}
      eastTexasCTATitle="East Texas Flea & Tick Control Experts"
    />
  )
}
