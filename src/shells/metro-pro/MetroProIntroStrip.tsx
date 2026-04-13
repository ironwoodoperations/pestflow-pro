import { Link } from 'react-router-dom'

interface Props {
  businessName: string
  city: string
  aboutIntro: string
  phone: string
}

export default function MetroProIntroStrip({ businessName, city, aboutIntro, phone }: Props) {
  const heading = businessName
    ? `${businessName} — ${city ? `${city} ` : ''}Pest Control, Termite and Mosquito Professionals`
    : 'Your Local Pest Control, Termite and Mosquito Professionals'

  return (
    <section className="py-16" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left: placeholder image */}
        <div className="relative rounded-xl overflow-hidden" style={{ minHeight: '320px', background: 'linear-gradient(135deg, var(--color-bg-hero) 0%, var(--color-primary) 100%)' }}>
          <div className="absolute inset-0 flex items-end p-6">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
              <p className="text-white font-semibold text-sm">{businessName || 'Your Pest Control Team'}</p>
              <p className="text-white/70 text-xs">Licensed &amp; Insured</p>
            </div>
          </div>
        </div>

        {/* Right: content */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-accent)' }}>About Us</p>
          <h2 className="text-2xl md:text-3xl font-bold mb-5 leading-tight" style={{ color: 'var(--color-primary)' }}>
            {heading}
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            {aboutIntro || `${businessName || 'Our team'} provides industry-leading pest control solutions for residential and commercial properties. We combine cutting-edge technology with proven techniques to deliver lasting results.`}
          </p>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Our licensed technicians have the expertise to handle any pest challenge, from common household insects to complex termite infestations — backed by our satisfaction guarantee.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/quote" className="font-semibold px-6 py-3 rounded-lg text-white text-center transition hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
              Schedule Inspection
            </Link>
            <Link to="/about" className="font-semibold px-6 py-3 rounded-lg text-center transition hover:bg-gray-50" style={{ border: '2px solid var(--color-primary)', color: 'var(--color-primary)' }}>
              About Us
            </Link>
          </div>
          {phone && (
            <p className="mt-4 text-sm text-gray-500">
              Or call us: <a href={`tel:${phone.replace(/\D/g, '')}`} className="font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>{phone}</a>
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
