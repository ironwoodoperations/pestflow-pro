import PestPageTemplate from '../components/PestPageTemplate'

export default function TermiteInspections() {
  return (
    <PestPageTemplate
      pageSlug="termite-inspections"
      heroTitle="Termite Inspections in East Texas"
      heroHighlight="Termite Inspections"
      heroSubtitle="WDI reports for home sales — fast turnaround."
      introHeading="Certified Wood-Destroying Insect Inspections"
      introP1="Buying or selling a home in East Texas? A Wood-Destroying Insect (WDI) inspection is required for most real estate transactions in Texas. Our licensed inspectors provide thorough, certified WDI reports with fast turnaround."
      introP2="Our inspections cover all wood-destroying insects including subterranean termites, drywood termites, carpenter ants, and wood-boring beetles. We also check for wood-destroying fungi and moisture conditions that attract these pests."
      introP3="Whether you need a WDI report for a home sale, a routine annual inspection for your own peace of mind, or a pre-construction inspection for new builds, we have you covered."
      steps={[
        { title: 'Schedule', desc: 'Book your inspection online or by phone. We offer flexible scheduling including next-day appointments.' },
        { title: 'Inspect', desc: 'Licensed inspector performs thorough inspection of the entire structure per TPCL standards.' },
        { title: 'Report', desc: 'Official WDI report prepared with detailed findings, photos, and recommendations.' },
        { title: 'Deliver', desc: 'Report delivered within 24 hours — electronically or in print for your title company.' },
      ]}
      specialSectionTitle="What's Included in a WDI Report"
      specialCards={[
        { title: 'Official WDI Form', desc: 'Texas-standard WDI report required for real estate transactions. Accepted by all title companies, lenders, and real estate agents in Texas.' },
        { title: 'Complete Coverage', desc: 'Inspection covers termites, carpenter ants, wood-boring beetles, and wood-destroying fungi. Includes accessible attic, crawlspace, foundation, and exterior.' },
        { title: 'Treatment Recommendations', desc: 'If activity is found, the report includes specific treatment recommendations and cost estimates. We can treat the same day if needed.' },
      ]}
      faqs={[
        { q: 'Is a WDI inspection required for home sales in Texas?', a: 'While not legally required in all transactions, most lenders (especially VA and FHA) require a WDI inspection. It is strongly recommended for all home purchases in East Texas.' },
        { q: 'How long does the inspection take?', a: 'A typical WDI inspection takes 45-90 minutes depending on the size and accessibility of the home.' },
        { q: 'How quickly will I get the report?', a: 'Reports are delivered within 24 hours of the inspection. Rush delivery (same day) is available for urgent real estate closings.' },
        { q: 'What happens if termites are found?', a: 'If active termites are found, the report will detail the findings and recommend treatment. We can provide a treatment estimate and begin treatment quickly to avoid delaying the sale.' },
        { q: 'How much does a WDI inspection cost?', a: 'WDI inspection costs depend on the size and type of property. Contact us for current pricing. Group discounts available for real estate agents.' },
        { q: 'Do you offer annual inspection plans?', a: 'Yes. We offer annual termite inspection plans for homeowners who want ongoing monitoring and peace of mind. Plans include priority scheduling and discounted re-inspection rates.' },
      ]}
      eastTexasCTATitle="East Texas Termite Inspection Experts"
    />
  )
}
