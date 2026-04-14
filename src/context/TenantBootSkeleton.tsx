const SHIMMER_CSS = `
@keyframes pfp-shimmer {
  0%   { opacity: 0.35; }
  50%  { opacity: 0.6; }
  100% { opacity: 0.35; }
}
.pfp-shimmer { animation: pfp-shimmer 1.6s ease-in-out infinite; }
`

export default function TenantBootSkeleton() {
  return (
    <>
      <style>{SHIMMER_CSS}</style>
      <div style={{ background: '#0a0f1e', minHeight: '100vh', overflow: 'hidden' }}>
        {/* Nav bar skeleton */}
        <div
          className="pfp-shimmer"
          style={{ height: 64, background: '#111827', borderBottom: '1px solid #1f2937' }}
        />
        {/* Hero block skeleton */}
        <div
          className="pfp-shimmer"
          style={{ height: '72vh', background: '#0d1625', marginTop: 1 }}
        />
        {/* Strip below hero */}
        <div
          className="pfp-shimmer"
          style={{ height: '18vh', background: '#0f1e30', marginTop: 2 }}
        />
      </div>
    </>
  )
}
