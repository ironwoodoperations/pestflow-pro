import type { RevealReportData } from '../../../types/revealReport'

export default function ReportLocal({ data }: { data: RevealReportData }) {
  const cityCount    = data.cityPages.length
  const areaCount    = data.serviceAreas.length
  const displayAreas = data.serviceAreas.slice(0, 12)
  const moreAreas    = areaCount > 12 ? areaCount - 12 : 0

  return (
    <section style={{ padding: '48px 56px', borderBottom: '1px solid #e5e7eb', pageBreakInside: 'avoid' }}>
      <p style={{ fontSize: '12px', fontWeight: 700, color: data.primaryColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
        Section 4
      </p>
      <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#111', marginBottom: '8px' }}>
        Local Authority
      </h2>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '32px', maxWidth: '600px' }}>
        Google ranks local service businesses based on geographic relevance. Your site speaks Google's language for every city you serve.
      </p>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '32px' }}>
        {/* City pages stat */}
        <div style={{ flex: '1 1 180px', padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <p style={{ fontSize: '48px', fontWeight: 800, color: data.primaryColor, lineHeight: 1 }}>{cityCount}</p>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '6px' }}>City-specific<br />landing pages</p>
        </div>

        {/* Service areas stat */}
        <div style={{ flex: '1 1 180px', padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <p style={{ fontSize: '48px', fontWeight: 800, color: data.primaryColor, lineHeight: 1 }}>{areaCount}</p>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '6px' }}>Service areas<br />declared in schema</p>
        </div>

        {/* Sitemap */}
        <div style={{ flex: '1 1 180px', padding: '24px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #86efac', textAlign: 'center' }}>
          <p style={{ fontSize: '32px', lineHeight: 1, marginBottom: '8px' }}>🗺️</p>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#15803d' }}>XML Sitemap Live</p>
          <p style={{ fontSize: '11px', color: '#166534', marginTop: '4px', wordBreak: 'break-all' }}>{data.sitemapUrl}</p>
        </div>
      </div>

      {/* City pages list */}
      {cityCount > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
            Live City Pages
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {data.cityPages.slice(0, 20).map(city => (
              <span key={city} style={{ padding: '4px 10px', background: '#eff6ff', borderRadius: '20px', fontSize: '12px', color: '#1e40af', fontWeight: 500 }}>
                {city}
              </span>
            ))}
            {cityCount > 20 && (
              <span style={{ padding: '4px 10px', background: '#f3f4f6', borderRadius: '20px', fontSize: '12px', color: '#6b7280' }}>
                +{cityCount - 20} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Service areas */}
      {areaCount > 0 && (
        <div>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
            Service Areas in Schema
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {displayAreas.map(area => (
              <span key={area} style={{ padding: '3px 8px', background: '#f9fafb', borderRadius: '4px', fontSize: '12px', color: '#374151', border: '1px solid #e5e7eb' }}>
                {area}
              </span>
            ))}
            {moreAreas > 0 && (
              <span style={{ padding: '3px 8px', background: '#f3f4f6', borderRadius: '4px', fontSize: '12px', color: '#9ca3af' }}>
                +{moreAreas} more
              </span>
            )}
          </div>
        </div>
      )}

      {cityCount === 0 && areaCount === 0 && (
        <p style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>
          No city pages or service areas configured yet. Adding these in the admin dashboard will strengthen local rankings.
        </p>
      )}
    </section>
  )
}
