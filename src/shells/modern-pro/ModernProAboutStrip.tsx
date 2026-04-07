import { Link } from 'react-router-dom'

interface Props {
  businessName: string
  intro: string
  foundedYear?: string
  techCount?: string
  licenseNumber?: string
  imageUrl?: string
}

export default function ModernProAboutStrip({ businessName, intro, foundedYear, techCount, licenseNumber, imageUrl }: Props) {
  const stats = [
    foundedYear && { label: 'Founded', value: foundedYear },
    techCount && { label: 'Technicians', value: techCount },
    licenseNumber && { label: 'License', value: licenseNumber },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left — image */}
        <div>
          {imageUrl ? (
            <img src={imageUrl} alt={businessName} className="w-full h-80 object-cover rounded-2xl shadow-lg" />
          ) : (
            <div
              className="w-full h-80 rounded-2xl shadow-lg flex items-center justify-center"
              style={{ background: 'var(--color-bg-section)' }}
            >
              <span style={{ color: 'var(--color-primary)' }} className="text-6xl">🏠</span>
            </div>
          )}
        </div>

        {/* Right — text */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2"
             style={{ color: 'var(--color-primary)' }}>
            ABOUT US
          </p>
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-heading)' }}>
            About {businessName}
          </h2>
          {intro && (
            <p className="leading-relaxed mb-6" style={{ color: '#4b5563' }}>
              {intro}
            </p>
          )}
          {stats.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-6">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="px-4 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--color-bg-section)', color: 'var(--color-heading)' }}
                >
                  <span className="font-semibold">{stat.label}:</span> {stat.value}
                </div>
              ))}
            </div>
          )}
          <Link
            to="/about"
            className="mt-2 px-6 py-3 rounded-lg font-semibold inline-block"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
          >
            Learn More About Us
          </Link>
        </div>
      </div>
    </section>
  )
}
