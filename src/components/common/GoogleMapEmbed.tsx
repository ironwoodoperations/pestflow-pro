interface Props {
  address: string
  apiKey?: string
  zoom?: number
  height?: string
}

export default function GoogleMapEmbed({ address, apiKey, zoom = 11, height = '400px' }: Props) {
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
  const key = apiKey || envKey

  if (key && address) {
    const src = `https://www.google.com/maps/embed/v1/place?key=${key}&q=${encodeURIComponent(address)}&zoom=${zoom}`
    return (
      <iframe
        src={src}
        title="Map"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        style={{ width: '100%', height, border: 0, borderRadius: '0.75rem' }}
      />
    )
  }

  // Fallback: link to Google Maps
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(address || '')}`
  return (
    <div
      className="bg-gray-100 rounded-xl flex items-center justify-center p-8 text-center"
      style={{ height }}
    >
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-emerald-600 font-medium text-lg hover:text-emerald-700 transition underline"
      >
        View on Google Maps →
      </a>
    </div>
  )
}
