import { useState } from 'react'

interface VideoImageProps {
  src: string
  alt: string
  videoUrl?: string
  className?: string
}

export default function VideoImage({ src, alt, videoUrl, className = '' }: VideoImageProps) {
  const [playing, setPlaying] = useState(false)

  if (playing && videoUrl) {
    return (
      <div className={`relative ${className}`}>
        <video
          src={videoUrl}
          poster={src}
          autoPlay
          controls
          className="w-full h-full object-cover rounded-lg"
        />
        <button
          onClick={() => setPlaying(false)}
          className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-black z-10"
        >✕</button>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <img src={src} alt={alt} className="w-full h-full object-cover rounded-lg" />
      {videoUrl && (
        <button
          onClick={() => setPlaying(true)}
          className="absolute inset-0 flex items-center justify-center group"
          aria-label="Play video"
        >
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg group-hover:bg-emerald-400 transition-colors animate-pulse">
            <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </button>
      )}
    </div>
  )
}
