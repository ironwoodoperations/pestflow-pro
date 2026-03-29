create extension if not exists "uuid-ossp";

create table public.profiles (
  id uuid references auth.users primary key,
  tenant_id uuid not null,
  full_name text,
  role text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  role text not null,
  created_at timestamptz default now()
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(required_role text)
returns boolean language plpgsql security definer as $$
begin
  return exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = required_role
  );
end;
$$;

create table public.tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  subdomain text unique,
  custom_domain text unique,
  created_at timestamptz default now()
);
alter table public.tenants enable row level security;

create table public.page_content (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  page_slug text not null,
  title text,
  subtitle text,
  intro text,
  video_url text,
  video_type text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(tenant_id, page_slug)
);
alter table public.page_content enable row level security;

create table public.seo_meta (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  page_slug text not null,
  meta_title text,
  meta_description text,
  user_edited boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(tenant_id, page_slug)
);
alter table public.seo_meta enable row level security;

create table public.blog_posts (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  title text not null,
  slug text not null,
  content text,
  excerpt text,
  published_at timestamptz,
  created_at timestamptz default now(),
  unique(tenant_id, slug)
);
alter table public.blog_posts enable row level security;

create table public.location_data (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  city text not null,
  slug text not null,
  hero_title text,
  is_live boolean default false,
  intro_video_url text,
  created_at timestamptz default now(),
  unique(tenant_id, slug)
);
alter table public.location_data enable row level security;

create table public.testimonials (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  author_name text,
  review_text text,
  rating integer default 5,
  featured boolean default false,
  source text default 'manual',
  google_review_id text,
  created_at timestamptz default now()
);
alter table public.testimonials enable row level security;

create table public.leads (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  name text,
  email text,
  phone text,
  services text[],
  message text,
  status text default 'new',
  created_at timestamptz default now()
);
alter table public.leads enable row level security;

create table public.settings (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  key text not null,
  value jsonb,
  updated_at timestamptz default now(),
  unique(tenant_id, key)
);
alter table public.settings enable row level security;

create table public.keyword_tracker (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  keyword text,
  page_slug text,
  volume integer,
  difficulty integer,
  created_at timestamptz default now()
);
alter table public.keyword_tracker enable row level security;

create table public.keyword_placements (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  keyword text,
  page_slug text,
  placement_type text,
  suggested_text text,
  applied boolean default false,
  created_at timestamptz default now()
);
alter table public.keyword_placements enable row level security;

create table public.page_snapshots (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  page_slug text,
  snapshot_type text,
  snapshot_data jsonb,
  created_at timestamptz default now()
);
alter table public.page_snapshots enable row level security;

create table public.social_posts (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  platform text,
  caption text,
  image_url text,
  status text default 'draft',
  facebook_post_id text,
  scheduled_for timestamptz,
  created_at timestamptz default now()
);
alter table public.social_posts enable row level security;

create policy "tenant_access_profiles" on public.profiles for all using (auth.uid() = id);
create policy "tenant_access_user_roles" on public.user_roles for all using (auth.uid() = user_id);
create policy "tenant_access_page_content" on public.page_content for all using (auth.role() = 'authenticated');
create policy "tenant_access_seo_meta" on public.seo_meta for all using (auth.role() = 'authenticated');
create policy "tenant_access_blog_posts" on public.blog_posts for all using (auth.role() = 'authenticated');
create policy "tenant_access_location_data" on public.location_data for all using (auth.role() = 'authenticated');
create policy "tenant_access_testimonials" on public.testimonials for all using (auth.role() = 'authenticated');
create policy "tenant_access_leads" on public.leads for all using (auth.role() = 'authenticated');
create policy "tenant_access_settings" on public.settings for all using (auth.role() = 'authenticated');
create policy "tenant_access_keyword_tracker" on public.keyword_tracker for all using (auth.role() = 'authenticated');
create policy "tenant_access_keyword_placements" on public.keyword_placements for all using (auth.role() = 'authenticated');
create policy "tenant_access_page_snapshots" on public.page_snapshots for all using (auth.role() = 'authenticated');
create policy "tenant_access_social_posts" on public.social_posts for all using (auth.role() = 'authenticated');
create policy "tenant_access_tenants" on public.tenants for all using (auth.role() = 'authenticated');

insert into storage.buckets (id, name, public) values ('social-uploads', 'social-uploads', true);
insert into storage.buckets (id, name, public) values ('videos', 'videos', true);
insert into storage.buckets (id, name, public) values ('logos', 'logos', true);
