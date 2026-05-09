import { type DemoTenant, SHELL_ACCENT_COLORS, publicDemoUrl, adminDemoUrl } from '../../lib/demoTenants';

const F = { b: "'Plus Jakarta Sans', sans-serif" };

interface Props {
  tenant: DemoTenant;
  mode: 'public' | 'admin';
}

export default function DemoCard({ tenant, mode }: Props) {
  const accent = SHELL_ACCENT_COLORS[tenant.shell];
  const href = mode === 'admin' ? adminDemoUrl(tenant.slug) : publicDemoUrl(tenant.slug);
  const ctaLabel = mode === 'admin' ? 'Open admin →' : 'View live site →';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        background: '#ffffff',
        borderRadius: 14,
        border: '1px solid rgba(15,23,42,0.08)',
        borderTop: `4px solid ${accent}`,
        boxShadow: '0 4px 14px rgba(15,23,42,0.06)',
        padding: '22px 22px 20px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = 'translateY(-3px)';
        el.style.boxShadow = `0 12px 28px rgba(15,23,42,0.1), 0 0 0 2px ${accent}40`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = '0 4px 14px rgba(15,23,42,0.06)';
      }}
    >
      <div style={{ fontFamily: F.b, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, marginBottom: 8 }}>
        {tenant.shell.replace('-', ' ')}
      </div>

      <div style={{ fontFamily: F.b, fontSize: 22, fontWeight: 700, color: '#0f172a', lineHeight: 1.2, marginBottom: 4 }}>
        {tenant.name}
      </div>

      <div style={{ fontFamily: F.b, fontSize: 13, fontWeight: 500, color: '#64748b', marginBottom: 14 }}>
        {tenant.city}, {tenant.state}
      </div>

      <p style={{ fontFamily: F.b, fontSize: 14, color: '#334155', lineHeight: 1.6, margin: 0, flex: 1 }}>
        {tenant.persona}
      </p>

      <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(15,23,42,0.06)', fontFamily: F.b, fontSize: 14, fontWeight: 600, color: accent }}>
        {ctaLabel}
      </div>
    </a>
  );
}
