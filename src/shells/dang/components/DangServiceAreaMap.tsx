import { useEffect, useRef } from 'react'

// Tyler, TX center coordinates
const TYLER_LAT = 32.3513
const TYLER_LNG = -95.3011
const RADIUS_METERS = 80467 // 50 miles

export default function DangServiceAreaMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Dynamic import to avoid SSR issues and reduce initial bundle
    import('leaflet').then((L) => {
      // Leaflet CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      // Fix default icon paths broken by bundlers
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (!containerRef.current) return

      const map = L.map(containerRef.current, {
        center: [TYLER_LAT, TYLER_LNG],
        zoom: 9,
        scrollWheelZoom: false,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      // 50-mile radius circle using Dang primary color (#F97316)
      L.circle([TYLER_LAT, TYLER_LNG], {
        radius: RADIUS_METERS,
        color: '#F97316',
        fillColor: '#F97316',
        fillOpacity: 0.12,
        weight: 2,
        opacity: 0.4,
      }).addTo(map)

      // Center marker
      L.marker([TYLER_LAT, TYLER_LNG])
        .addTo(map)
        .bindPopup('<strong>Dang Pest Control</strong><br/>Tyler, TX')

      mapRef.current = map
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '400px', borderRadius: '0.75rem', overflow: 'hidden' }}
    />
  )
}
