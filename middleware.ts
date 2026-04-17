import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

const TENANT_CACHE = new Map<string, { data: TenantTheme; exp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

interface TenantTheme {
  id: string;
  slug: string;
  name: string;
  template: string;
  primary_color: string;
  accent_color: string;
  logo_url: string;
  cta_text: string;
}

async function getTenant(slug: string): Promise<TenantTheme | null> {
  const cached = TENANT_CACHE.get(slug);
  if (cached && Date.now() < cached.exp) return cached.data;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/get_tenant_boot?slug_param=${encodeURIComponent(slug)}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    if (!res.ok) return null;
    const data: TenantTheme = await res.json();
    if (!data?.id) return null;
    TENANT_CACHE.set(slug, { data, exp: Date.now() + CACHE_TTL_MS });
    return data;
  } catch {
    return null;
  }
}

function darken(hex: string): string {
  try {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, ((n >> 16) & 0xff) - 38);
    const g = Math.max(0, ((n >> 8) & 0xff) - 38);
    const b = Math.max(0, (n & 0xff) - 38);
    return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
  } catch {
    return hex;
  }
}

export const config = {
  matcher: [
    '/((?!admin|ironwood|_next/static|_next/image|favicon|api|.*\\.(?:js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';

  if (hostname === 'pestflowpro.com' || hostname === 'www.pestflowpro.com') {
    return NextResponse.next();
  }

  const slug = hostname.split('.')[0];
  if (!slug) return NextResponse.next();

  const tenant = await getTenant(slug);
  if (!tenant) return NextResponse.next();

  const response = NextResponse.next();

  response.headers.set('x-tenant-id', tenant.id);
  response.headers.set('x-tenant-slug', tenant.slug);
  response.headers.set('x-tenant-name', tenant.name);
  response.headers.set('x-tenant-template', tenant.template);
  response.headers.set('x-tenant-primary', tenant.primary_color);
  response.headers.set('x-tenant-accent', tenant.accent_color);
  response.headers.set('x-tenant-logo', tenant.logo_url);
  response.headers.set('x-tenant-cta', tenant.cta_text);
  response.headers.set('x-tenant-primary-dark', darken(tenant.primary_color));

  return response;
}
