import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../hooks/useTenant'

interface HeroMedia {
  youtube_id?: string
  thumbnail_url?: string
}

export default function HeroVideoPlayer() {
  const { tenantId } = useTenant()
  const [media, setMedia] = useState<HeroMedia | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!tenantId) return
    supabase
      .from('settings')
      .select('value')
      .eq('tenant_id', tenantId)
      .eq('key', 'hero_media')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value?.youtube_id) setMedia(data.value)
      })
  }, [tenantId])

  if (!media?.youtube_id) return null

  const embedUrl = `https://www.youtube-nocookie.com/embed/${media.youtube_id}?autoplay=1&mute=1&loop=1&playlist=${media.youtube_id}&controls=0&rel=0&showinfo=0&modestbranding=1`

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Thumbnail fallback shown while iframe loads or on error */}
      {media.thumbnail_url && (
        <img
          src={media.thumbnail_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {!error && (
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: 'scale(1.2)' }}
          allow="autoplay; encrypted-media"
          allowFullScreen={false}
          title="Background video"
          onError={() => setError(true)}
        />
      )}

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/60" />
    </div>
  )
}
