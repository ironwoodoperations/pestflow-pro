import { useCallback, useEffect, useRef } from 'react'

interface Props {
  address: string
  city: string
  businessName: string
}

const MAP_STYLES = [
  { featureType: 'all', elementType: 'geometry.fill', stylers: [{ weight: '2.00' }] },
  { featureType: 'landscape', elementType: 'all', stylers: [{ color: '#f2f2f2' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#787878' }] },
  { featureType: 'water', elementType: 'all', stylers: [{ color: '#cbe5f0' }] },
]

declare global {
  interface Window {
    google?: { maps?: unknown }
    _mapsLoading?: boolean
    _mapsLoaded?: boolean
  }
}

function loadMapsApi(apiKey: string): Promise<void> {
  if (window._mapsLoaded) return Promise.resolve()
  if (window._mapsLoading) {
    return new Promise(resolve => {
      const interval = setInterval(() => { if (window._mapsLoaded) { clearInterval(interval); resolve() } }, 100)
    })
  }
  window._mapsLoading = true
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
    script.async = true
    script.onload = () => { window._mapsLoaded = true; resolve() }
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export default function LocationMap({ address, city, businessName }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

  const renderMap = useCallback((G: unknown, container: HTMLDivElement, center: unknown) => {
    const maps = (G as { maps: { Map: new (...a: unknown[]) => unknown; Marker: new (...a: unknown[]) => unknown } }).maps
    const map = new maps.Map(container, {
      center, zoom: 13,
      styles: MAP_STYLES,
      mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
    })
    new maps.Marker({ map, position: center, title: `${businessName} — ${city}` })
  }, [businessName, city])

  useEffect(() => {
    if (!apiKey || !mapRef.current) return
    const container = mapRef.current

    loadMapsApi(apiKey).then(() => {
      if (!container || !window.google) return
      const G = window.google as unknown
      const maps = (G as { maps: { Geocoder: new () => { geocode: (q: unknown, cb: (r: unknown[], s: string) => void) => void } } }).maps
      const geocoder = new maps.Geocoder()
      const query = address ? `${address}, ${city}` : city

      geocoder.geocode({ address: query }, (results: unknown[], status: string) => {
        if (status !== 'OK' || !results?.[0]) {
          geocoder.geocode({ address: city }, (r2: unknown[], s2: string) => {
            if (s2 !== 'OK' || !r2?.[0]) return
            renderMap(G, container, (r2[0] as { geometry: { location: unknown } }).geometry.location)
          })
          return
        }
        renderMap(G, container, (results[0] as { geometry: { location: unknown } }).geometry.location)
      })
    }).catch(() => { /* silently fallback — fallback UI shown via apiKey check below */ })
  }, [address, city, apiKey, renderMap])

  if (!apiKey) {
    return (
      <div className="w-full rounded-xl bg-gray-100 flex flex-col items-center justify-center py-12 text-center border border-gray-200">
        <span className="text-gray-400 text-sm">Map loading…</span>
        <span className="text-gray-500 text-xs mt-1">{address}</span>
      </div>
    )
  }

  return <div ref={mapRef} className="w-full rounded-xl overflow-hidden" style={{ height: '400px' }} />
}
