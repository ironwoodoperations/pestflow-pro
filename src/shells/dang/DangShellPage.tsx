import { Link } from 'react-router-dom'
import { usePageContent } from '../../hooks/usePageContent'

interface Props {
  slug: string
  defaultTitle: string
  defaultIntro: string
}

export default function DangShellPage({ slug, defaultTitle, defaultIntro }: Props) {
  const { content } = usePageContent(slug)

  const title = content?.title ?? defaultTitle
  const intro = content?.intro ?? content?.subtitle ?? defaultIntro

  return (
    <div>
      {/* Hero banner */}
      <section
        style={{
          backgroundColor: 'hsl(28,100%,50%)',
          backgroundImage: "url('/hero-streaks.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '80px 24px 60px',
          color: 'white',
        }}
      >
        <div className="mx-auto max-w-[1100px]">
          <h1 className="dang-text-comic italic uppercase"
            style={{ fontSize: 'clamp(32px,4vw,56px)', color: 'hsl(45,95%,60%)', fontWeight: 800, lineHeight: 1.0, marginBottom: '16px' }}>
            {title}
          </h1>
          {intro && (
            <p style={{ fontSize: '18px', lineHeight: 1.7, maxWidth: '600px', color: 'white' }}>{intro}</p>
          )}
        </div>
      </section>

      {/* Body content */}
      {content?.body && (
        <section className="py-16" style={{ background: '#fff', backgroundImage: 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
          <div className="container mx-auto px-4 max-w-3xl prose" dangerouslySetInnerHTML={{ __html: content.body }} />
        </section>
      )}

      {/* CTA */}
      <section className="py-12 text-center" style={{ backgroundColor: 'hsl(45,100%,51%)' }}>
        <h2 className="dang-text-comic text-3xl mb-4" style={{ color: 'hsl(20,40%,12%)' }}>Ready to Get Started?</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/quote" className="inline-flex items-center justify-center font-bold rounded-full px-8 py-3 text-white transition-all"
            style={{ backgroundColor: 'hsl(28,100%,50%)' }}>
            Get Your Quote
          </Link>
          <a href="tel:9038710550" className="inline-flex items-center justify-center font-bold rounded-full px-8 py-3 border-2 transition-all"
            style={{ borderColor: 'hsl(20,40%,12%)', color: 'hsl(20,40%,12%)' }}>
            Call (903) 871-0550
          </a>
        </div>
      </section>
    </div>
  )
}
