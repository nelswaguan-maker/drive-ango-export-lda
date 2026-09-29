-- DRIVE ANGO — CONTACTO GERAL DO SITE
-- Execute este ficheiro no Supabase SQL Editor se não quiseres executar o supabase-schema.sql completo.

create table if not exists public.site_settings (
  id smallint primary key default 1 check (id=1),
  whatsapp text not null default '',
  phone text not null default '',
  email text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "Public can read site contacts" on public.site_settings;
create policy "Public can read site contacts" on public.site_settings
for select to anon, authenticated using (true);

drop policy if exists "Admins can insert site contacts" on public.site_settings;
create policy "Admins can insert site contacts" on public.site_settings
for insert to authenticated with check (public.is_current_user_admin());

drop policy if exists "Admins can update site contacts" on public.site_settings;
create policy "Admins can update site contacts" on public.site_settings
for update to authenticated using (public.is_current_user_admin()) with check (public.is_current_user_admin());

insert into public.site_settings (id) values (1) on conflict (id) do nothing;
