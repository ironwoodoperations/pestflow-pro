import { useState, useRef } from 'react'

interface VideoImageProps {
  src: string
  alt: string
  videoUrl?: string
  className?: string
}

export default function VideoImage({ src, alt, videoUrl, className = '' }: VideoImageProps) {
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  function handlePlay() {
    setPlaying(true)
    setTimeout(() => videoRef.current?.play(), 50)
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {playing && videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          onEnded={() => setPlaying(false)}
        />
      ) : (
        <>
          <img src={src} alt={alt} loading="lazy" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          {videoUrl && (
            <button
              type="button"
              aria-label="Play video"
              onClick={handlePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500 group-hover:bg-emerald-400 flex items-center justify-center shadow-lg transition-colors">
                <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </button>
          )}
        </>
      )}
    </div>
  )
}
