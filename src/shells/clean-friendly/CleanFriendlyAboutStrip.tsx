import { Link } from 'react-router-dom'

interface Props {
  businessName: string
  intro: string
  foundedYear?: string
  techCount?: string
  imageUrl?: string
}

export default function CleanFriendlyAboutStrip({ businessName, intro, foundedYear, techCount, imageUrl }: Props) {
  const stats = [
    foundedYear && { label: 'Est.', value: foundedYear },
    techCount   && { label: 'Technicians', value: techCount },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

        {/* Left — text */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2"
             style={{ color: 'var(--color-primary)' }}>
            ABOUT US
          </p>
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-heading)' }}>
            About {businessName}
          </h2>
          {intro && (
            <p className="leading-relaxed mb-6 text-gray-600">{intro}</p>
          )}
          {stats.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-6">
              {stats.map(stat => (
                <div key={stat.label} className="px-4 py-2 rounded-lg text-sm border border-gray-100"
                     style={{ background: 'var(--color-bg-section)', color: 'var(--color-heading)' }}>
                  <span className="font-semibold">{stat.label}:</span> {stat.value}
                </div>
              ))}
            </div>
          )}
          <Link to="/about" className="inline-block px-6 py-3 rounded-lg font-semibold text-sm"
                style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}>
            Learn More About Us
          </Link>
        </div>

        {/* Right — image */}
        <div>
          {imageUrl ? (
            <img src={imageUrl} alt={businessName}
                 className="w-full h-80 object-cover rounded-2xl shadow-md" />
          ) : (
            <div className="w-full h-80 rounded-2xl shadow-md flex items-center justify-center"
                 style={{ background: 'var(--color-bg-section)' }}>
              <div className="w-16 h-16 rounded-full opacity-20"
                   style={{ background: 'var(--color-primary)' }} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
