import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { cacheTags, type RevalidatePayload } from '../../_lib/cacheTags';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // 1. Extract JWT
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'missing_auth' }, { status: 401 });
  }

  // 2. Verify JWT — anon client required for auth.getUser()
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: userData, error: userErr } = await anonClient.auth.getUser();
  if (userErr || !userData.user) {
    return NextResponse.json({ error: 'invalid_jwt' }, { status: 401 });
  }

  // 3. Parse body
  let body: RevalidatePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  if (!body.type || !body.tenantId || !body.tenantSlug) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  // 4. Verify tenant admin membership (service role bypasses RLS)
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: membership } = await serviceClient
    .from('tenant_users')
    .select('role')
    .eq('user_id', userData.user.id)
    .eq('tenant_id', body.tenantId)
    .maybeSingle();

  if (!membership || !['admin', 'owner'].includes(membership.role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // 5. Revalidate by tag + bust Full Route Cache
  if (body.type === 'page') {
    if (!('slug' in body) || !body.slug) {
      return NextResponse.json({ error: 'slug_required_for_page' }, { status: 400 });
    }
    revalidateTag(cacheTags.page(body.tenantId, body.slug));
    revalidateTag(cacheTags.allPages(body.tenantId));
    revalidatePath('/tenant/[slug]', 'layout');
  } else if (body.type === 'settings') {
    revalidateTag(cacheTags.settings(body.tenantId));
    revalidatePath(`/tenant/${body.tenantSlug}`, 'layout');
  } else if (body.type === 'testimonials') {
    revalidateTag(cacheTags.testimonials(body.tenantId));
    revalidatePath(`/tenant/${body.tenantSlug}`, 'layout');
  } else if (body.type === 'blog') {
    revalidateTag(cacheTags.blog(body.tenantId));
    revalidatePath(`/tenant/${body.tenantSlug}`, 'layout');
  } else if (body.type === 'locations') {
    revalidateTag(cacheTags.locations(body.tenantId));
    revalidatePath(`/tenant/${body.tenantSlug}`, 'layout');
  } else if (body.type === 'team') {
    revalidateTag(cacheTags.team(body.tenantId));
    revalidatePath(`/tenant/${body.tenantSlug}`, 'layout');
  } else if (body.type === 'faq') {
    revalidateTag(cacheTags.faq(body.tenantId));
    revalidatePath(`/tenant/${body.tenantSlug}`, 'layout');
  } else {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
