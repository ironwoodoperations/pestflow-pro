import { useState, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';

interface VideoImageProps {
  src: string;
  alt: string;
  className?: string;
  videoUrl?: string | null;
  videoType?: string | null; // 'youtube' | 'upload'
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function VideoImage({ src, alt, className = '', videoUrl, videoType }: VideoImageProps) {
  const [playing, setPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasVideo = !!videoUrl;

  // Click outside → revert to image
  useEffect(() => {
    if (!playing) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPlaying(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [playing]);

  const youtubeId = videoUrl && (videoType === 'youtube' || !videoType)
    ? getYouTubeId(videoUrl)
    : null;

  return (
    <div ref={containerRef} className="relative" style={{ display: 'inline-block', width: '100%' }}>
      {/* Image — always rendered, hidden when playing */}
      <div style={{ display: playing ? 'none' : 'block' }}>
        <img src={src} alt={alt} className={className} />
      </div>

      {/* Video player — shown when playing */}
      {playing && (
        <div className="w-full" style={{ aspectRatio: '16/9' }}>
          {youtubeId ? (
            <iframe
              className="w-full h-full rounded-2xl"
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
              title={alt}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => {}} // YouTube handles ended event via postMessage — revert handled by click-outside
            />
          ) : (
            <video
              className="w-full h-full rounded-2xl"
              src={videoUrl!}
              autoPlay
              controls
              onEnded={() => setPlaying(false)}
            />
          )}
        </div>
      )}

      {/* Play button — shown below image if video exists and not playing */}
      {hasVideo && !playing && (
        <button
          onClick={() => setPlaying(true)}
          className="flex items-center gap-2 mt-3 mx-auto font-bold text-sm rounded-full px-5 py-2.5 transition-all hover:brightness-110 active:scale-95"
          style={{
            background: 'hsl(28, 100%, 50%)',
            color: 'white',
            display: 'flex',
            width: 'fit-content',
          }}
          aria-label={`Play video for ${alt}`}
        >
          <Play className="w-4 h-4 fill-white" />
          Watch Video
        </button>
      )}
    </div>
  );
}
