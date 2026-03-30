import PestPageTemplate from '../components/PestPageTemplate'

export default function PestControlPage() {
  return (
    <PestPageTemplate
      pageSlug="pest-control"
      introImage="/images/pests/pest-control.jpg"
      heroTitle="General Pest Control in East Texas"
      heroHighlight="Pest Control"
      heroSubtitle="One plan. All pests. Year-round protection."
      introHeading="Complete Home Pest Protection"
      introP1="East Texas is home to dozens of pest species that invade homes year-round. Instead of treating each pest individually, our general pest control plans provide comprehensive protection against all common household pests."
      introP2="Our trained technicians perform a full inspection, then create a customized treatment plan that addresses your specific pest pressures. We treat both interior and exterior, creating a protective barrier around your home."
      introP3="With regular maintenance visits, we catch new pest activity early and keep your home protected all year. Our plans include coverage for ants, spiders, roaches, wasps, and other common household pests."
      steps={[
        { title: 'Full Inspection', desc: 'Comprehensive inspection of your entire property to identify all pest activity and entry points.' },
        { title: 'Custom Plan', desc: 'Create a customized treatment plan based on your home, pest pressures, and family needs.' },
        { title: 'Treatment', desc: 'Interior and exterior treatment targeting all active pests and creating a protective barrier.' },
        { title: 'Maintenance', desc: 'Quarterly maintenance visits to maintain protection and catch new pest activity early.' },
      ]}
      specialSectionTitle="Our Pest Protection Plans"
      specialCards={[]}
      pricingCards={[
        { name: 'Monthly Plan', price: '$49/mo', desc: 'Monthly treatments for homes with heavy pest pressure. Includes interior and exterior service.' },
        { name: 'Quarterly Plan', price: '$99/quarter', desc: 'Our most popular plan. Quarterly treatments keep your home protected year-round.' },
        { name: 'Annual Plan', price: '$299/year', desc: 'Best value for proactive homeowners. Annual plan with quarterly visits included.' },
      ]}
      faqs={[
        { q: 'What pests are covered by your general plan?', a: 'Our general pest control covers ants, spiders, roaches, wasps, silverfish, earwigs, crickets, millipedes, and other common household pests. Specialty pests (termites, bed bugs, rodents) require separate services.' },
        { q: 'How often do you need to treat my home?', a: 'We recommend quarterly treatments for most homes. Homes with heavy pest pressure may benefit from monthly service. Our technicians will recommend the right frequency for your situation.' },
        { q: 'Do you treat the inside and outside?', a: 'Yes. Every visit includes both interior and exterior treatment. We focus on entry points, baseboards, window frames, and the exterior perimeter.' },
        { q: 'Are your treatments safe for kids and pets?', a: 'Yes. All products are EPA-approved and applied by licensed technicians. Products are safe for your family once dry, typically within 30-60 minutes.' },
        { q: 'What if I see pests between visits?', a: 'Call us anytime. All plans include free re-treatments between scheduled visits if pests return. We stand behind our service.' },
        { q: 'Do you offer a guarantee?', a: 'Yes. If pests return between scheduled services, we will retreat your home at no additional cost. Your satisfaction is guaranteed.' },
      ]}
      eastTexasCTATitle="East Texas Pest Control Experts"
    />
  )
}
