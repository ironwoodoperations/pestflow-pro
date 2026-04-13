import { useState } from 'react'

interface Props {
  videoId: string
}

export default function YouTubeFacade({ videoId }: Props) {
  const [playing, setPlaying] = useState(false)

  if (!videoId) return null

  if (playing) {
    return (
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title="Video player"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <div
      onClick={() => setPlaying(true)}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      {/* YouTube auto-thumbnail */}
      <img
        src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
        alt="Video thumbnail"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Dark overlay */}
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.2)' }} />

      {/* Dang orange play button — pure SVG, no icon lib */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg
          width="72" height="72" viewBox="0 0 72 72"
          style={{ filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.45))' }}
          aria-hidden="true"
        >
          <circle cx="36" cy="36" r="36" fill="#F97316" fillOpacity="0.93" />
          {/* Triangle play arrow — slightly right-offset for optical centering */}
          <polygon points="28,20 56,36 28,52" fill="white" />
        </svg>
      </div>
    </div>
  )
}
