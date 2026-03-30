import { Link } from 'react-router-dom'
import { Shield, Home, Bug, Star, Users, Heart, Eye, Award } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import StructuredData from '../components/StructuredData'
import HolidayBanner from '../components/HolidayBanner'

const TEAM = [
  { name: 'Marcus Holt', title: 'Owner & Founder', desc: 'Started Apex out of his garage in 2006. 20+ years in pest management.' },
  { name: 'Diana Holt', title: 'Operations Director', desc: 'Manages scheduling, training, and customer experience across all crews.' },
  { name: 'Jason Rivera', title: 'Lead Technician — Termite Division', desc: 'Certified WDI inspector. 12 years in structural pest control.' },
  { name: 'Megan Torres', title: 'Lead Technician — General Pest', desc: 'Specializes in residential quarterly programs and ant colony elimination.' },
  { name: 'Kyle Whitfield', title: 'Lead Technician — Wildlife & Rodent', desc: 'Expert in rodent exclusion, attic remediation, and wildlife management.' },
]

const VALUES = [
  { icon: <Shield className="w-7 h-7 text-emerald-500" />, title: 'Safety First', desc: 'Every product we use is EPA-approved and applied by licensed technicians. We choose pet-safe and kid-friendly formulations whenever possible.' },
  { icon: <Eye className="w-7 h-7 text-emerald-500" />, title: 'Transparency', desc: 'No hidden fees, no surprise charges. We explain exactly what we will do, how much it costs, and why — before we start any treatment.' },
  { icon: <Award className="w-7 h-7 text-emerald-500" />, title: 'Guaranteed Results', desc: "If pests return within 30 days of treatment, we come back and retreat at no additional cost. That's our promise." },
]

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <StructuredData type="WebPage" pageSlug="about" />
      <HolidayBanner />
      <Navbar />

      {/* Hero */}
      <section className="py-20 md:py-28" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 50%, #0f3d2e 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-bangers tracking-wide text-white text-5xl md:text-7xl mb-4">About <span className="text-emerald-400">Apex Pest Solutions</span></h1>
          <p className="text-gray-300 text-xl">Protecting Families. Eliminating Pests. Since 2006.</p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="rounded-xl overflow-hidden border-2 border-emerald-500 bg-[#0a0f1e] h-72 flex items-center justify-center">
              <img src="/images/pests/team.jpg" alt="Apex Pest Solutions team" loading="lazy" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
            <div>
              <h2 className="font-bangers tracking-wide text-3xl md:text-4xl text-gray-900 mb-4">Our Story</h2>
              <p className="text-gray-600 mb-4">
                Apex Pest Solutions started in 2006 when Marcus and Diana Holt decided their community deserved better pest control. Armed with a truck, a state license, and a commitment to doing things right, they launched the business out of their garage in Tyler, Texas.
              </p>
              <p className="text-gray-600 mb-4">
                Word spread fast. Customers loved the honest pricing, same-day response, and the fact that Marcus personally followed up after every job. Within three years, the one-truck operation grew to a team of five. Today, Apex employs 14 licensed technicians and serves the entire greater metro area.
              </p>
              <p className="text-gray-600">
                We are fully licensed, bonded, and insured. Every technician is EPA-certified and trained in the latest integrated pest management techniques. We are proud members of the National Pest Management Association (NPMA).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-[#1e293b]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { num: '18+', label: 'Years Experience', icon: <Star className="w-6 h-6 mx-auto mb-2" /> },
              { num: '4,200+', label: 'Homes Protected', icon: <Home className="w-6 h-6 mx-auto mb-2" /> },
              { num: '98%', label: 'Customer Satisfaction', icon: <Heart className="w-6 h-6 mx-auto mb-2" /> },
              { num: 'Same-Day', label: 'Service Available', icon: <Bug className="w-6 h-6 mx-auto mb-2" /> },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-emerald-400">{s.icon}</div>
                <div className="text-emerald-400 text-3xl font-bold">{s.num}</div>
                <div className="text-gray-400 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-bangers tracking-wide text-3xl md:text-4xl text-gray-900 text-center mb-10">What We Stand For</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-white rounded-xl p-6 shadow-sm text-center">
                <div className="flex justify-center mb-4">{v.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-gray-600 text-sm">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-bangers tracking-wide text-3xl md:text-4xl text-gray-900 text-center mb-10">Meet Our Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEAM.map((member, i) => (
              <div key={member.name} className="bg-[#f8fafc] rounded-xl p-6 text-center">
                <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                  {i < 2 ? (
                    <img src={i === 0 ? '/images/pests/exterminator.jpg' : '/images/pests/team.jpg'} alt={member.name} loading="lazy" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <Users className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                <p className="text-emerald-600 text-sm font-medium">{member.title}</p>
                <p className="text-gray-500 text-sm mt-2">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-bangers tracking-wide text-3xl md:text-4xl text-gray-900 text-center mb-10">Licensed & Certified</h2>
          <div className="flex flex-wrap gap-6 justify-center">
            {['NPMA Member', 'TPCA Member', 'BBB Accredited', 'TDA Licensed', 'EPA Certified'].map((cert) => (
              <div key={cert} className="bg-white rounded-xl px-8 py-6 text-center text-gray-500 font-medium border border-gray-200 shadow-sm">{cert}</div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 50%, #0f3d2e 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-bangers tracking-wide text-4xl md:text-5xl text-white mb-4">Ready to Be Pest-Free?</h2>
          <p className="text-gray-300 text-lg mb-8">Get your free quote today — same-day service available.</p>
          <Link to="/quote" className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-10 py-4 text-lg transition">Get a Free Quote</Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
