import { notFound } from 'next/navigation';
import { resolveTenantBySlug } from '../../../shared/lib/tenant/resolve';

export const dynamic = 'force-dynamic';

export default async function TenantHome({
  params,
}: {
  params: { slug: string };
}) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) notFound();

  const primary = tenant.branding.primary_color ?? '#111111';

  return (
    <main style={{
      padding: '3rem 2rem',
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '720px',
      margin: '0 auto',
    }}>
      <h1 style={{ color: primary, marginTop: 0 }}>
        Hello from {tenant.name}
      </h1>
      <dl style={{ lineHeight: 1.8 }}>
        <dt><strong>Slug</strong></dt>
        <dd>{tenant.slug}</dd>
        <dt><strong>Tenant ID</strong></dt>
        <dd><code>{tenant.id}</code></dd>
        <dt><strong>Primary color</strong></dt>
        <dd><code style={{ color: primary }}>{primary}</code></dd>
        <dt><strong>Template</strong></dt>
        <dd>{tenant.branding.template ?? '(not set)'}</dd>
      </dl>
      <p style={{ marginTop: '2rem', color: '#666' }}>
        This page was server-rendered by Next.js. No client-side tenant fetch
        occurred. No skeleton was shown.
      </p>
    </main>
  );
}
