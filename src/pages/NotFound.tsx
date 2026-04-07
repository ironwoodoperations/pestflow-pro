import { Link } from 'react-router-dom'
import StructuredData from '../components/StructuredData'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg-section)' }}>
      <StructuredData type="WebPage" pageSlug="404" />

      <section
        className="flex-1 flex items-center justify-center py-24 px-4"
        style={{ background: 'var(--color-bg-hero)' }}
      >
        <div className="text-center max-w-lg">
          <div className="text-[10rem] font-black opacity-20 select-none leading-none" style={{ color: 'var(--color-primary)' }}>
            404
          </div>
          <div className="text-6xl -mt-8 mb-6">🐛</div>
          <h1 className="text-3xl md:text-4xl font-bold -mt-2 mb-3" style={{ color: 'var(--color-nav-text)' }}>
            Looks like this page got away
          </h1>
          <p className="mb-8" style={{ color: 'var(--color-nav-text)', opacity: 0.65 }}>
            We couldn't find what you were looking for. The page may have moved
            or the URL might be wrong.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/" className="font-medium rounded-lg px-6 py-3 transition hover:opacity-90" style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
              ← Back Home
            </Link>
            <Link to="/quote" className="border font-medium rounded-lg px-6 py-3 transition hover:opacity-80" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
              Get a Free Quote
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-6 gap-y-2 justify-center text-sm text-gray-500">
            <Link to="/pest-control" className="transition hover:opacity-80" style={{ color: 'var(--color-nav-text)', opacity: 0.6 }}>Services</Link>
            <Link to="/about" className="transition hover:opacity-80" style={{ color: 'var(--color-nav-text)', opacity: 0.6 }}>About</Link>
            <Link to="/blog" className="transition hover:opacity-80" style={{ color: 'var(--color-nav-text)', opacity: 0.6 }}>Blog</Link>
            <Link to="/contact" className="transition hover:opacity-80" style={{ color: 'var(--color-nav-text)', opacity: 0.6 }}>Contact</Link>
            <Link to="/admin" className="transition hover:opacity-80" style={{ color: 'var(--color-nav-text)', opacity: 0.6 }}>Admin</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
