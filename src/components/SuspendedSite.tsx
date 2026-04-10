export default function SuspendedSite() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '400px' }}>
        <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
          Site temporarily unavailable.
        </p>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Contact support for assistance.
        </p>
      </div>
    </div>
  )
}
