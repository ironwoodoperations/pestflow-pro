import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Home, Bug, Star, Heart, Eye, Award, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import StructuredData from '../components/StructuredData'

interface TeamMember { id: string; name: string; title?: string; bio?: string; photo_url?: string }

const VALUE_ICONS = [Shield, Eye, Award, Zap]
const VALUES = [
  { title: 'Science-Backed Solutions', desc: 'Every treatment plan is based on Integrated Pest Management (IPM) principles. We target the root cause, not just the symptoms.' },
  { title: 'Transparent Pricing', desc: 'We quote before we treat. No hidden fees, no upselling, no surprise invoices. The price we quote is the price you pay.' },
  { title: '30-Day Guarantee', desc: "If pests return within 30 days of treatment, we come back and retreat at no additional cost. That's our Ironclad Guarantee." },
  { title: 'Same-Day Response', desc: "Call before noon and we'll be at your property the same day. Your family's safety shouldn't wait." },
]

export default function About() {
  const [heroTitle, setHeroTitle] = useState('About Ironclad Pest Solutions')
  const [heroSubtitle, setHeroSubtitle] = useState('Family-owned. Science-backed. Trusted since 2009.')
  const [aboutImage, setAboutImage] = useState<string | null>(null)
  const [team, setTeam] = useState<TeamMember[] | null>(null)

  useEffect(() => {
    resolveTenantId().then(async (tid) => {
      if (!tid) return
      const [pageRes, teamRes] = await Promise.all([
        supabase.from('page_content').select('title, subtitle, image_urls').eq('tenant_id', tid).eq('page_slug', 'about').maybeSingle(),
        supabase.from('team_members').select('id, name, title, bio, photo_url').eq('tenant_id', tid).order('display_order'),
      ])
      if (pageRes.data?.title) setHeroTitle(pageRes.data.title)
      if (pageRes.data?.subtitle) setHeroSubtitle(pageRes.data.subtitle)
      if (pageRes.data?.image_urls?.[0]) setAboutImage(pageRes.data.image_urls[0])
      setTeam(teamRes.data || [])
    })
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <StructuredData type="WebPage" pageSlug="about" />

      <section className="py-20 md:py-28" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 50%, #0f3d2e 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-oswald tracking-wide text-white text-5xl md:text-7xl mb-4" dangerouslySetInnerHTML={{ __html: heroTitle }} />
          <p className="text-gray-300 text-xl">{heroSubtitle}</p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="rounded-xl overflow-hidden border-2 bg-[#0a0f1e] h-72 flex items-center justify-center" style={{ borderColor: 'var(--color-primary)' }}>
              <img src={aboutImage || '/images/pests/team.jpg'} alt="About us" loading="lazy" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
            <div>
              <h2 className="font-oswald tracking-wide text-3xl md:text-4xl text-gray-900 mb-4">Our Story</h2>
              <p className="text-gray-600 mb-4">Ironclad Pest Solutions was founded in 2009 by Ryan Carter in Tyler, Texas. After a decade working for national chains, Ryan saw an opportunity to do things differently — with better products, honest pricing, and genuine commitment to every customer.</p>
              <p className="text-gray-600 mb-4">What started as a one-truck operation has grown into one of East Texas's most trusted pest control companies. Today, Ironclad employs 12 licensed technicians and serves Tyler, Longview, Jacksonville, and surrounding communities.</p>
              <p className="text-gray-600">We are fully licensed, bonded, and insured. Every technician is EPA-certified and trained in the latest integrated pest management techniques. We are proud members of the NPMA and TPCA.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-[#f8fafc]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-oswald tracking-wide text-3xl md:text-4xl text-gray-900 mb-6">Our Mission</h2>
          <p className="text-gray-600 text-lg leading-relaxed">To protect Texas homes and businesses with science-backed pest control solutions delivered by local professionals who treat your property like their own.</p>
        </div>
      </section>

      <section className="py-12 bg-[#1e293b]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { num: '15+', label: 'Years Experience', icon: <Star className="w-6 h-6 mx-auto mb-2" /> },
              { num: '4,200+', label: 'Homes Protected', icon: <Home className="w-6 h-6 mx-auto mb-2" /> },
              { num: '98%', label: 'Customer Satisfaction', icon: <Heart className="w-6 h-6 mx-auto mb-2" /> },
              { num: 'Same-Day', label: 'Service Available', icon: <Bug className="w-6 h-6 mx-auto mb-2" /> },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ color: 'var(--color-primary)' }}>{s.icon}</div>
                <div className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>{s.num}</div>
                <div className="text-gray-400 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-oswald tracking-wide text-3xl md:text-4xl text-gray-900 text-center mb-10">Why Ironclad?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {VALUES.map((v, i) => {
              const Icon = VALUE_ICONS[i]
              return (
                <div key={v.title} className="bg-[#f8fafc] rounded-xl p-6 flex gap-4">
                  <div className="flex-shrink-0 mt-1" style={{ color: 'var(--color-primary)' }}><Icon className="w-7 h-7" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{v.title}</h3>
                    <p className="text-gray-600 text-sm">{v.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-oswald tracking-wide text-3xl md:text-4xl text-gray-900 text-center mb-10">Meet Our Team</h2>
          {team === null ? null : team.length === 0 ? (
            <p className="text-center text-gray-400 text-base">Our team will be featured here.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {team.map((member) => (
                <div key={member.id} className="bg-white rounded-xl p-6 text-center shadow-sm">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden flex items-center justify-center">
                    {member.photo_url ? (
                      <img src={member.photo_url} alt={member.name} loading="lazy" className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    ) : (
                      <span className="text-2xl font-bold text-gray-400 select-none">
                        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                  {member.title && <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>{member.title}</p>}
                  {member.bio && <p className="text-gray-500 text-sm mt-2">{member.bio}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-oswald tracking-wide text-3xl md:text-4xl text-gray-900 text-center mb-10">Licensed & Certified</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            {['NPMA Member', 'TPCA Certified', 'BBB Accredited', 'TDA Licensed', 'EPA Certified', 'WDI Inspector'].map((cert) => (
              <div key={cert} className="bg-[#f8fafc] rounded-xl px-6 py-4 text-center text-gray-500 font-medium border border-gray-200 shadow-sm text-sm">{cert}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 50%, #0f3d2e 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-oswald tracking-wide text-4xl md:text-5xl text-white mb-4">Ready to Be Pest-Free?</h2>
          <p className="text-gray-300 text-lg mb-8">Get your free quote today — same-day service available.</p>
          <Link to="/quote" className="inline-block font-bold rounded-lg px-10 py-4 text-lg transition hover:opacity-90" style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>Get a Free Quote</Link>
        </div>
      </section>

    </div>
  )
}
