const DEMO = 'https://pestflow-pro.pestflowpro.com'
const ADMIN = 'https://pestflow-pro.pestflowpro.com/admin'

const C = {
  green: '#22c55e', amber: '#fbbf24',
  text: '#f1f5f9', muted: '#cbd5e8',
}

const STATS = [
  { val: '4', label: 'Templates' },
  { val: '1 Platform', label: 'All Tools' },
  { val: '30 Day', label: 'Rollout' },
  { val: '$149', label: 'Starting/Month' },
]

export default function MarketingHero() {
  return (
    <section style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      background: '#0a0f1e', padding: '80px 24px 60px',
    }}>
      {/* Gradient blobs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
          width: 700, height: 500,
          background: 'radial-gradient(ellipse, rgba(34,197,94,0.18) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', right: '-10%',
          width: 500, height: 500,
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.15) 0%, transparent 70%)',
        }} />
        {/* Grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.07,
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 1px, transparent 1px, transparent 60px)',
        }} />
      </div>

      <div style={{ position: 'relative', textAlign: 'center', maxWidth: 780 }}>
        {/* Eyebrow */}
        <div style={{
          display: 'inline-block', marginBottom: 24,
          padding: '6px 16px', borderRadius: 20,
          border: '1px solid rgba(34,197,94,0.3)',
          background: 'rgba(34,197,94,0.08)',
          color: C.green, fontSize: 13,
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500,
        }}>🌿 Built for Local Pest Operators</div>

        {/* H1 */}
        <h1 style={{
          fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
          fontSize: 'clamp(36px, 6vw, 68px)', lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: C.text, margin: '0 0 24px',
        }}>
          The{' '}
          <span style={{
            background: 'linear-gradient(135deg, #22c55e 0%, #3b82f6 50%, #fbbf24 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Operating System</span>
          {' '}for Pest Control Companies
        </h1>

        {/* Subtext */}
        <p style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400,
          fontSize: 18, color: C.muted, lineHeight: 1.7,
          margin: '0 0 40px', maxWidth: 600, marginInline: 'auto',
        }}>
          Your website, SEO blog, social media, lead capture, and client management —
          all in one platform. Stop juggling five tools and start growing.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 60 }}>
          <a href={DEMO} target="_blank" rel="noopener noreferrer" style={{
            padding: '14px 28px', borderRadius: 10,
            background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
            color: '#0a0f1e', fontSize: 15, fontWeight: 700,
            fontFamily: "'Plus Jakarta Sans', sans-serif", textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(251,191,36,0.3)',
          }}>🚀 Try Live Demo Now</a>
          <a href={ADMIN} target="_blank" rel="noopener noreferrer" style={{
            padding: '14px 28px', borderRadius: 10,
            border: '1px solid rgba(59,130,246,0.4)',
            background: 'rgba(59,130,246,0.08)',
            color: '#93c5fd', fontSize: 15, fontWeight: 600,
            fontFamily: "'Plus Jakarta Sans', sans-serif", textDecoration: 'none',
          }}>Open Admin Dashboard →</a>
        </div>

        {/* Stats */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: 40,
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20,
        }}>
          {STATS.map(s => (
            <div key={s.label}>
              <p style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', color: C.text, margin: 0 }}>{s.val}</p>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: C.muted, margin: '4px 0 0' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
