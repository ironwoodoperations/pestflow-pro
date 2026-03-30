import { Link } from 'react-router-dom'
import { Shield, Home, Bug, Star, Users } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="py-20 md:py-28" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 50%, #0f3d2e 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-bangers tracking-wide text-white text-5xl md:text-7xl mb-4">About <span className="text-emerald-400">PestFlow Pro</span></h1>
          <p className="text-gray-300 text-xl">Protecting East Texas families and businesses since day one.</p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-bangers tracking-wide text-3xl md:text-4xl text-gray-900 mb-6">Our Mission</h2>
          <p className="text-gray-600 text-lg mb-4">We believe every family deserves a pest-free home. Our mission is to protect East Texas homes and businesses with safe, effective, and affordable pest control solutions delivered by local professionals who care about your community.</p>
          <p className="text-gray-600 text-lg">From our first inspection to ongoing maintenance, we treat every home like our own. That means thorough service, honest pricing, and a satisfaction guarantee on every job.</p>
        </div>
      </section>

      <section className="py-12 bg-[#1e293b]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { num: '10+', label: 'Years Experience', icon: <Star className="w-6 h-6 mx-auto mb-2" /> },
              { num: '5,000+', label: 'Homes Protected', icon: <Home className="w-6 h-6 mx-auto mb-2" /> },
              { num: '12', label: 'Pest Types Covered', icon: <Bug className="w-6 h-6 mx-auto mb-2" /> },
              { num: '100%', label: 'Satisfaction Rate', icon: <Shield className="w-6 h-6 mx-auto mb-2" /> },
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

      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-bangers tracking-wide text-3xl md:text-4xl text-gray-900 text-center mb-10">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Team Lead', title: 'Owner & Lead Technician' },
              { name: 'Service Manager', title: 'Operations Manager' },
              { name: 'Field Specialist', title: 'Senior Pest Technician' },
            ].map((member) => (
              <div key={member.name} className="bg-white rounded-xl p-6 shadow-sm text-center">
                <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center"><Users className="w-8 h-8 text-gray-400" /></div>
                <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                <p className="text-gray-500 text-sm">{member.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-bangers tracking-wide text-3xl md:text-4xl text-gray-900 text-center mb-10">Licensed & Certified</h2>
          <div className="flex flex-wrap gap-6 justify-center">
            {['NPMA Member', 'TPCA Member', 'BBB Accredited', 'TDA Licensed'].map((cert) => (
              <div key={cert} className="bg-[#f8fafc] rounded-xl px-8 py-6 text-center text-gray-500 font-medium border border-gray-200">{cert}</div>
            ))}
          </div>
        </div>
      </section>

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
