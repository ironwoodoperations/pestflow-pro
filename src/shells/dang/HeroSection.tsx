import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'

const DEFAULT_VIDEO = 'https://www.dangpestcontrol.com/wp-content/uploads/2025/04/dang-pest-homepage.mp4'
const POSTER = 'https://www.dangpestcontrol.com/wp-content/uploads/2025/06/dang-pest-homepage-img-1.webp'

function extractYouTubeId(url: string): string | null {
  if (!url) return null
  const patterns = [
    /youtube\.com\/shorts\/([^?&/]+)/,
    /[?&]v=([^?&/]+)/,
    /youtu\.be\/([^?&/]+)/,
    /embed\/([^?&/]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

interface Props {
  dynamicVideoUrl?: string
  dynamicVideoType?: string
  videoStart?: string
  videoEnd?: string
  heroTitle?: string
  heroIntro?: string
}

export default function HeroSection({ dynamicVideoUrl, dynamicVideoType, videoStart, videoEnd, heroTitle, heroIntro }: Props) {
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const videoSrc = dynamicVideoUrl || DEFAULT_VIDEO
  const isYouTube = dynamicVideoType === 'youtube' || extractYouTubeId(videoSrc) !== null
  const youtubeId = isYouTube ? extractYouTubeId(videoSrc) : null

  const ytParams = () => {
    const p = new URLSearchParams({ autoplay: '1', rel: '0' })
    if (videoStart) p.set('start', videoStart)
    if (videoEnd) p.set('end', videoEnd)
    return p.toString()
  }

  const handlePlay = () => {
    setIsPlaying(true)
    if (!isYouTube) setTimeout(() => videoRef.current?.play(), 100)
  }

  return (
    <section
      className="text-white relative overflow-hidden"
      style={{
        backgroundColor: 'hsl(28, 100%, 50%)',
        backgroundImage: "url('/hero-streaks.webp')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        paddingTop: '60px',
        paddingBottom: '140px',
      }}
    >
      <div className="mx-auto max-w-[1100px] px-6 sm:px-12 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-[42fr_58fr] items-center gap-8 sm:gap-10">
          <div>
            <h1 className="dang-text-comic italic uppercase" style={{ color: 'hsl(45,95%,60%)', fontSize: 'clamp(38px,5vw,60px)', fontWeight: 800, lineHeight: 1.0, marginBottom: '24px' }}>
              {heroTitle ?? 'Super Powered\u00A0Pest Control'}
            </h1>
            <p style={{ fontSize: '18px', lineHeight: 1.75, marginBottom: '32px', color: 'white', maxWidth: '480px' }}>
              {heroIntro ?? 'We are a hands-on, personable, relationship-based company. We live, work, worship, and play in the Tyler community. Our innovative pest control practices make us stand out amongst our competitors. Our goal is to be an active part in making our community and the lives of our clients better.'}
            </p>
            <Link to="/quote" className="font-bold transition-all duration-200 inline-flex items-center"
              style={{ backgroundColor: 'white', color: 'hsl(28,100%,50%)', border: '2px solid white', borderRadius: '146px', padding: '10px 28px', fontSize: '15px' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'hsl(45,95%,60%)'; e.currentTarget.style.borderColor = 'hsl(45,95%,60%)'; e.currentTarget.style.color = 'white' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = 'white'; e.currentTarget.style.color = 'hsl(28,100%,50%)' }}
            >Get Your Quote</Link>
          </div>
          <div>
            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', aspectRatio: '16/9', border: '4px solid hsl(185,100%,45%)', boxShadow: '0 0 30px hsla(185,100%,45%,0.5)' }}>
              {!isPlaying ? (
                <div style={{ position: 'relative', width: '100%', height: '100%', cursor: 'pointer' }} onClick={handlePlay}>
                  <img src={POSTER} alt="Meet Kirk" fetchPriority="high" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Play style={{ width: '28px', height: '28px', color: '#333', marginLeft: '4px' }} />
                    </div>
                  </div>
                </div>
              ) : isYouTube && youtubeId ? (
                <iframe src={`https://www.youtube.com/embed/${youtubeId}?${ytParams()}`} title="Dang Pest Control" style={{ width: '100%', height: '100%' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              ) : (
                <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls autoPlay playsInline poster={POSTER}>
                  <source src={videoSrc} type="video/mp4" />
                </video>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
