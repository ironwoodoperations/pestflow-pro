import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import StructuredData from '../components/StructuredData'

const FAQ_CATEGORIES = [
  {
    title: 'General',
    faqs: [
      { q: 'What pests do you treat?', a: 'We treat all common East Texas pests including mosquitoes, spiders, ants, wasps, cockroaches, fleas, ticks, rodents, scorpions, bed bugs, and termites.' },
      { q: 'Are you licensed and insured?', a: 'Yes. We are fully licensed by the Texas Department of Agriculture, bonded, and insured. All technicians hold current pest control licenses.' },
      { q: 'Do you offer free estimates?', a: 'Yes. We provide free inspections and estimates for all pest control services. Call us or fill out our online quote form to schedule.' },
      { q: 'What areas do you serve?', a: 'We serve Tyler, Longview, Jacksonville, Lindale, Bullard, Whitehouse, and all of East Texas within a 50-mile radius.' },
    ],
  },
  {
    title: 'Treatments',
    faqs: [
      { q: 'Are your treatments safe for kids and pets?', a: 'Yes. All products are EPA-approved and applied by licensed technicians. Treatments are safe once dry, typically within 30-60 minutes.' },
      { q: 'How long do treatments take?', a: 'Most treatments take 45-90 minutes depending on the size of your home and the type of pest being treated.' },
      { q: 'Do I need to leave my home during treatment?', a: 'For most treatments, no. We will advise you if any specific precautions are needed for your particular treatment plan.' },
      { q: 'How soon will I see results?', a: 'Many pests are eliminated within 24-48 hours. Some treatments (like bait systems) take 1-2 weeks to fully eliminate the colony. Your technician will set expectations.' },
    ],
  },
  {
    title: 'Pricing',
    faqs: [
      { q: 'How much does pest control cost?', a: 'Costs vary by service type and home size. General pest control plans start at $49/month. Contact us for a free estimate tailored to your needs.' },
      { q: 'Do you offer service plans?', a: 'Yes. We offer monthly, quarterly, and annual plans. Plans include scheduled treatments plus free re-treatments between visits if pests return.' },
      { q: 'Do you offer a guarantee?', a: 'Yes. All services are backed by our satisfaction guarantee. If pests return between scheduled treatments, we will retreat at no additional cost.' },
    ],
  },
]

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      <StructuredData type="WebPage" pageSlug="faq" />
      <Navbar />

      <section className="py-20 md:py-28" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 50%, #0f3d2e 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-bangers tracking-wide text-white text-5xl md:text-7xl mb-4">Frequently Asked Questions</h1>
          <p className="text-gray-300 text-xl">Everything you need to know about our pest control services.</p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          {FAQ_CATEGORIES.map((cat) => (
            <div key={cat.title} className="mb-12">
              <h2 className="text-2xl font-bold text-emerald-600 mb-6">{cat.title}</h2>
              <div className="space-y-6">
                {cat.faqs.map((faq, i) => (
                  <div key={i}>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.q}</h3>
                    <p className="text-gray-600">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-bangers tracking-wide text-3xl md:text-4xl text-gray-900 mb-4">Still Have Questions?</h2>
          <p className="text-gray-600 mb-8">We're here to help. Call us or request a quote online.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:9035550100" className="border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-bold rounded-lg px-8 py-4 text-lg transition">Call (903) 555-0100</a>
            <Link to="/quote" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-8 py-4 text-lg transition">Get a Free Quote</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
