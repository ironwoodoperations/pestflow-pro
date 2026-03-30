import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 100%)' }}
      className="min-h-screen flex flex-col items-center justify-center text-center px-4">

      <div className="text-9xl font-black text-emerald-500 opacity-20 select-none leading-none mb-0">
        404
      </div>

      <div className="text-6xl -mt-8 mb-6">🐛</div>

      <h1 className="text-3xl font-bold text-white mb-3">
        Looks like this page got away
      </h1>
      <p className="text-gray-400 max-w-md mb-8">
        We couldn't find what you were looking for. The page may have moved
        or the URL might be wrong.
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        <Link to="/" className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
          Back to Home
        </Link>
        <Link to="/quote" className="border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 px-6 py-3 rounded-lg font-medium transition-colors">
          Get a Free Quote
        </Link>
      </div>

      <div className="mt-12 flex flex-wrap gap-x-6 gap-y-2 justify-center text-sm text-gray-500">
        <Link to="/pest-control" className="hover:text-emerald-400 transition-colors">Services</Link>
        <Link to="/about" className="hover:text-emerald-400 transition-colors">About</Link>
        <Link to="/blog" className="hover:text-emerald-400 transition-colors">Blog</Link>
        <Link to="/contact" className="hover:text-emerald-400 transition-colors">Contact</Link>
        <Link to="/admin" className="hover:text-emerald-400 transition-colors">Admin</Link>
      </div>
    </div>
  )
}
