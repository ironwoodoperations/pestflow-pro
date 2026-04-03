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
      className="relative bg-[#0a0f1e] text-white py-24 px-4 overflow-hidden"
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      {backgroundImage && <div className="absolute inset-0 bg-[#0a0f1e]/70" />}
      <div className="relative max-w-4xl mx-auto text-center">
        <h1 className="font-oswald text-5xl md:text-6xl font-bold tracking-wide mb-6 leading-tight">
          {title.split(' ').map((word, i) => (
            <span key={i}>
              {i === 0 ? <span className="text-emerald-400">{word}</span> : ` ${word}`}
            </span>
          ))}
        </h1>
        {subtitle && <p className="text-gray-300 text-lg md:text-xl mb-8 max-w-2xl mx-auto">{subtitle}</p>}
        <Link
          to={ctaHref}
          className="inline-block bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-lg px-8 py-4 rounded-xl transition shadow-lg shadow-emerald-900/40"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  )
}
