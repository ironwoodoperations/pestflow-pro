import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import StructuredData from '../components/StructuredData'
import HeroVideoPlayer from '../components/HeroVideoPlayer'
import { useShellSections } from '../components/PublicShell'

interface PageContent {
  title: string
  subtitle: string
}

const DEFAULT_CONTENT: PageContent = {
  title: 'Protect Your Home from Unwanted Pests',
  subtitle: 'Licensed & insured professionals serving East Texas with fast, effective pest control.',
}

export default function Index() {
  const [content, setContent] = useState<PageContent>(DEFAULT_CONTENT)
  const [heroMedia, setHeroMedia] = useState<{ youtube_id?: string; thumbnail_url?: string } | null>(null)
  const [videoPlaying, setVideoPlaying] = useState(false)
  const ShellSections = useShellSections()

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [pageRes, mediaRes] = await Promise.all([
        supabase.from('page_content').select('title, subtitle').eq('tenant_id', tenantId).eq('page_slug', 'home').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'hero_media').maybeSingle(),
      ])
      if (pageRes.data) {
        setContent({ title: pageRes.data.title || DEFAULT_CONTENT.title, subtitle: pageRes.data.subtitle || DEFAULT_CONTENT.subtitle })
      }
      if (mediaRes.data?.value?.youtube_id) setHeroMedia(mediaRes.data.value)
    })
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <StructuredData type="LocalBusiness" />

      {/* HERO */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: '600px', background: 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 50%, #0f3d2e 100%)' }}
      >
        {/* Hero fallback image — shown behind gradient overlay when no video */}
        <img src="/images/pests/hero.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" loading="eager" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />

        {/* Full-bleed background video — renders behind hero text, falls back to gradient */}
        <HeroVideoPlayer />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto py-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm mb-6">
            <Shield className="w-4 h-4" /> Licensed & Insured Professionals
          </div>
          <h1 className="font-oswald tracking-wide text-white text-5xl sm:text-6xl md:text-8xl leading-tight mb-6">
            East Texas's Most Trusted{' '}
            <span className="text-emerald-400">Pest Control</span>
          </h1>
          <p className="text-gray-300 text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            {content.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/quote" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-8 py-4 text-lg transition">
              Get a Free Quote
            </Link>
            <Link to="/pest-control" className="border-2 border-white/30 text-white hover:border-white font-bold rounded-lg px-8 py-4 text-lg transition">
              See Our Services
            </Link>
          </div>
          <a href="tel:9035550100" className="text-gray-300 text-xl font-semibold hover:text-white transition">
            (903) 555-0100
          </a>

          {/* Hero Video */}
          {heroMedia?.youtube_id && (
            <div className="mt-10 max-w-2xl mx-auto">
              {!videoPlaying ? (
                <button type="button" aria-label="Play video" className="relative rounded-xl overflow-hidden cursor-pointer shadow-2xl w-full text-left" style={{ paddingBottom: '56.25%' }} onClick={() => setVideoPlaying(true)}>
                  <img src={heroMedia.thumbnail_url || `https://img.youtube.com/vi/${heroMedia.youtube_id}/maxresdefault.jpg`} alt="Video thumbnail" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="relative rounded-xl overflow-hidden shadow-2xl" style={{ paddingBottom: '56.25%' }}>
                  <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube.com/embed/${heroMedia.youtube_id}?autoplay=1`} allow="autoplay; fullscreen" allowFullScreen title="Hero video" />
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <ShellSections />

    </div>
  )
}
