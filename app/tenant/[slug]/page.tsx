'use client';

import { useTenant } from './TenantProvider';

export default function TenantPage() {
  const tenant = useTenant();

  return (
    <main
      style={{
        padding: '4rem 2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: 720,
        margin: '0 auto',
      }}
    >
      <h1
        style={{
          color: 'var(--color-primary)',
          fontSize: '2.5rem',
          margin: 0,
          lineHeight: 1.1,
        }}
      >
        Hello from {tenant.name}
      </h1>

      <p style={{ color: 'var(--color-accent)', marginTop: '1rem' }}>
        Template: {tenant.template} · Primary: {tenant.primary_color} ·
        Accent: {tenant.accent_color}
      </p>

      <p style={{ marginTop: '2rem', opacity: 0.6, fontSize: '0.9rem' }}>
        Server-rendered. Shell port begins S142.
      </p>
    </main>
  );
}
