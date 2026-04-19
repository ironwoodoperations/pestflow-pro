'use client';

import { useState } from 'react';

interface Props {
  posterUrl: string;
  youtubeId?: string;
  videoUrl?: string;
  caption?: string;
  aspectRatio?: string;
  playButtonColor?: string;
  className?: string;
}

export function VideoPosterPlayer({
  posterUrl,
  youtubeId,
  videoUrl,
  caption,
  aspectRatio = '16 / 9',
  playButtonColor = 'rgba(255,255,255,0.92)',
  className,
}: Props) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className={className}>
      <div style={{ position: 'relative', aspectRatio, overflow: 'hidden', backgroundColor: '#000' }}>
        {playing ? (
          youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            />
          ) : videoUrl ? (
            <video
              src={videoUrl}
              autoPlay
              controls
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : null
        ) : (
          <button
            onClick={() => setPlaying(true)}
            aria-label="Play video"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              border: 'none', padding: 0, cursor: 'pointer', background: 'none',
            }}
          >
            <img
              src={posterUrl}
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <span style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                width: 64, height: 64, borderRadius: '50%',
                backgroundColor: playButtonColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
              }}>
                <svg viewBox="0 0 24 24" width={28} height={28} aria-hidden="true">
                  <polygon points="9,6 20,12 9,18" fill="#1a1a1a" />
                </svg>
              </span>
            </span>
          </button>
        )}
      </div>
      {caption && (
        <p style={{ fontSize: '0.8rem', color: 'inherit', opacity: 0.6, marginTop: '0.5rem', textAlign: 'center' }}>
          {caption}
        </p>
      )}
    </div>
  );
}
