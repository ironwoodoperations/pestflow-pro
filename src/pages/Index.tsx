import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import StructuredData from '../components/StructuredData'
import HeroVideoPlayer from '../components/HeroVideoPlayer'
import { ShellSectionsRenderer } from '../components/PublicShell'
import { useTemplate } from '../context/TemplateContext'

interface PageContent {
  title: string
  subtitle: string
  heroImageUrl?: string
}

const DEFAULT_CONTENT: PageContent = {
  title: 'Professional Pest Control You Can Trust',
  subtitle: 'Licensed & insured professionals. Fast, effective results.',
}

export default function Index() {
  const { template } = useTemplate()
  const [content, setContent] = useState<PageContent>(DEFAULT_CONTENT)
  const [heroMedia, setHeroMedia] = useState<{ youtube_id?: string; thumbnail_url?: string } | null>(null)
  const [videoPlaying, setVideoPlaying] = useState(false)

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [pageRes, mediaRes] = await Promise.all([
        supabase.from('page_content').select('title, subtitle, image_1_url').eq('tenant_id', tenantId).eq('page_slug', 'home').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'hero_media').maybeSingle(),
      ])
      if (pageRes.data) {
        setContent({
          title: pageRes.data.title || DEFAULT_CONTENT.title,
          subtitle: pageRes.data.subtitle || DEFAULT_CONTENT.subtitle,
          heroImageUrl: pageRes.data.image_1_url || undefined,
        })
      }
      if (mediaRes.data?.value?.youtube_id) setHeroMedia(mediaRes.data.value)
    })
  }, [])

  // These shells own their own hero inside ShellSectionsRenderer — skip the standard hero
  if (template === 'youpest' || template === 'dang' || template === 'metro-pro') {
    return (
      <div style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <StructuredData type="LocalBusiness" />
        <ShellSectionsRenderer />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>
      <StructuredData type="LocalBusiness" />

      {/* HERO */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: '600px', background: 'linear-gradient(135deg, var(--color-bg-hero) 0%, var(--color-bg-hero-end) 100%)' }}
      >
        {/* Hero fallback image — shown behind gradient overlay when no video */}
        <img src={content.heroImageUrl || '/images/pests/hero.jpg'} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" loading="eager" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />

        {/* Full-bleed background video — renders behind hero text, falls back to bg */}
        <HeroVideoPlayer />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto py-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-6" style={{ border: '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)', backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', color: 'var(--color-primary)' }}>
            <Shield className="w-4 h-4" /> Licensed & Insured Professionals
          </div>
          <h1 className="font-oswald tracking-wide text-5xl sm:text-6xl md:text-8xl leading-tight mb-6" style={{ color: 'var(--color-nav-text)' }}>
            {content.title}
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto" style={{ color: 'var(--color-nav-text)', opacity: 0.75 }}>
            {content.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/quote" className="font-bold rounded-lg px-8 py-4 text-lg transition hover:opacity-90" style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
              Get a Free Quote
            </Link>
            <Link to="/pest-control" className="border-2 font-bold rounded-lg px-8 py-4 text-lg transition hover:opacity-80" style={{ borderColor: 'var(--color-nav-text)', color: 'var(--color-nav-text)', opacity: 0.8 }}>
              See Our Services
            </Link>
          </div>

          {/* Hero Video */}
          {heroMedia?.youtube_id && (
            <div className="mt-10 max-w-2xl mx-auto">
              {!videoPlaying ? (
                <button type="button" aria-label="Play video" className="relative rounded-xl overflow-hidden cursor-pointer shadow-2xl w-full text-left" style={{ paddingBottom: '56.25%' }} onClick={() => setVideoPlaying(true)}>
                  <img src={heroMedia.thumbnail_url || `https://img.youtube.com/vi/${heroMedia.youtube_id}/maxresdefault.jpg`} alt="Video thumbnail" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: 'var(--color-primary)' }}>
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

      <ShellSectionsRenderer />

    </div>
  )
}
