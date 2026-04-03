import { Link } from 'react-router-dom'

interface Props {
  title: string
  subtitle?: string
  ctaLabel?: string
  ctaHref?: string
  backgroundImage?: string
}

export default function ShellHero({ title, subtitle, ctaLabel = 'Get Free Quote', ctaHref = '/quote', backgroundImage }: Props) {
  return (
    <section
      className="relative bg-[#1c1c1c] text-white py-24 px-4 overflow-hidden"
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      {backgroundImage && <div className="absolute inset-0 bg-[#1c1c1c]/75" />}
      {/* Amber diagonal accent strip */}
      <div className="absolute top-0 right-0 w-2 h-full bg-[#d97706]" aria-hidden="true" />
      <div className="relative max-w-4xl mx-auto text-center">
        <div className="inline-block bg-[#d97706] text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
          Local. Trusted. Proven.
        </div>
        <h1 className="font-oswald text-5xl md:text-6xl font-bold tracking-wide mb-6 leading-tight text-white">
          {title}
        </h1>
        {subtitle && <p className="text-gray-300 text-lg md:text-xl mb-8 max-w-2xl mx-auto">{subtitle}</p>}
        <Link
          to={ctaHref}
          className="inline-block bg-[#d97706] hover:bg-[#b45309] text-white font-bold text-lg px-8 py-4 rounded-xl transition shadow-lg shadow-amber-900/40"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  )
}
