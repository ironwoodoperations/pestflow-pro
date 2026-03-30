import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HolidayBanner from '../components/HolidayBanner'
import StructuredData from '../components/StructuredData'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <StructuredData type="WebPage" pageSlug="404" />
      <HolidayBanner />
      <Navbar />

      {/* Hero-style 404 section */}
      <section
        className="flex-1 flex items-center justify-center py-24 px-4"
        style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 60%, #0f3d2e 100%)' }}
      >
        <div className="text-center max-w-lg">
          <div className="text-[10rem] font-black text-emerald-500 opacity-20 select-none leading-none">
            404
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white -mt-10 mb-4">
            Page Not Found
          </h1>
          <p className="text-gray-400 mb-8">
            The page you're looking for doesn't exist or may have been moved.
            Let's get you back on track.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/"
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              ← Back Home
            </Link>
            <Link
              to="/quote"
              className="border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Get a Free Quote
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
