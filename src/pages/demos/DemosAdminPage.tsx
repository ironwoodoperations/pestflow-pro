import { Link } from 'react-router-dom';
import { DEMO_TENANTS } from '../../lib/demoTenants';
import DemoCard from './DemoCard';

const F = { b: "'Plus Jakarta Sans', sans-serif" };

export default function DemosAdminPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#ffffff' }}>
      {/* Hero */}
      <section style={{ padding: '80px 24px 48px', textAlign: 'center', background: 'linear-gradient(180deg, #0f172a 0%, #131e36 100%)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p style={{ fontFamily: F.b, fontSize: 11, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#22c55e', marginBottom: 14 }}>
            Admin galleries
          </p>
          <h1 style={{ fontFamily: F.b, fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, lineHeight: 1.1, margin: '0 0 18px' }}>
            Behind the scenes
          </h1>
          <p style={{ fontFamily: F.b, fontSize: 17, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: '0 0 18px' }}>
            Each demo has a fully working admin dashboard. Hop in, edit content, swap branding, watch the public site update in real time.
          </p>
          <p
            style={{
              display: 'inline-block',
              fontFamily: F.b,
              fontSize: 13,
              color: '#bef264',
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.35)',
              borderRadius: 6,
              padding: '8px 14px',
              margin: 0,
            }}
          >
            Login: <code style={{ fontFamily: 'monospace' }}>admin@demo.com</code> &nbsp;/&nbsp; <code style={{ fontFamily: 'monospace' }}>demo123</code>
          </p>
        </div>
      </section>

      {/* Card grid */}
      <section style={{ padding: '40px 24px 80px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 24,
            }}
          >
            {DEMO_TENANTS.map((t) => (
              <DemoCard key={t.slug} tenant={t} mode="admin" />
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{ padding: '20px 24px 64px', textAlign: 'center' }}>
        <Link
          to="/"
          style={{ fontFamily: F.b, fontSize: 14, fontWeight: 600, color: '#22c55e', textDecoration: 'none' }}
        >
          ← Back to PestFlow Pro
        </Link>
      </section>
    </div>
  );
}
