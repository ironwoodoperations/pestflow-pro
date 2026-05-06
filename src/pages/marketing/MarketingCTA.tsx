const DEMO = 'https://demo.pestflowpro.com'
const ADMIN = 'https://demo.pestflowpro.com/admin'

const C = { navy: '#0a0f1e', text: '#f1f5f9', muted: '#cbd5e8', green: '#22c55e', amber: '#fbbf24' }

export default function MarketingCTA() {
  return (
    <>
      {/* Final CTA */}
      <section style={{
        background: 'linear-gradient(160deg, rgba(34,197,94,0.1) 0%, #0a0f1e 60%)',
        borderTop: '1px solid rgba(34,197,94,0.15)',
        padding: '80px 24px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
            fontSize: 'clamp(26px,4vw,44px)', letterSpacing: '-0.02em', color: C.text,
            margin: '0 0 16px', lineHeight: 1.2,
          }}>
            Ready to see it working for a real pest company?
          </h2>
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16,
            color: C.muted, margin: '0 0 40px', lineHeight: 1.6,
          }}>
            The demo site is a fully functional PestFlow Pro installation.
            Everything you see is real — the same tools your clients will use.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={DEMO} target="_blank" rel="noopener noreferrer" style={{
              padding: '14px 26px', borderRadius: 10,
              background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
              color: '#0a0f1e', fontSize: 15, fontWeight: 700,
              fontFamily: "'Plus Jakarta Sans', sans-serif", textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(251,191,36,0.3)',
            }}>🚀 Try Live Demo Now</a>

            <a href={DEMO} target="_blank" rel="noopener noreferrer" style={{
              padding: '14px 26px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.15)',
              color: C.text, fontSize: 15, fontWeight: 500,
              fontFamily: "'Plus Jakarta Sans', sans-serif", textDecoration: 'none',
            }}>View Demo Site →</a>

            <a href={ADMIN} target="_blank" rel="noopener noreferrer" style={{
              padding: '14px 26px', borderRadius: 10,
              border: '1px solid rgba(59,130,246,0.3)',
              background: 'rgba(59,130,246,0.08)',
              color: '#93c5fd', fontSize: 15, fontWeight: 500,
              fontFamily: "'Plus Jakarta Sans', sans-serif", textDecoration: 'none',
            }}>Open Admin Dashboard →</a>

            <a href="mailto:hello@pestflowpro.com" style={{
              padding: '14px 26px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              color: C.muted, fontSize: 15, fontWeight: 500,
              fontFamily: "'Plus Jakarta Sans', sans-serif", textDecoration: 'none',
            }}>Contact Us</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#060b14',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: C.muted }}>
          © 2026 Ironwood Operations Group · PestFlow Pro
        </span>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: C.muted }}>
          Built for local pest operators
        </span>
      </footer>
    </>
  )
}
