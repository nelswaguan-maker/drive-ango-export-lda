-- DRIVE CARS: catálogo online partilhado e atualizações em tempo real
-- Executar uma vez no Supabase > SQL Editor.

create table if not exists public.drive_cars (
  id text primary key,
  stock text not null default '',
  views bigint not null default 0,
  brand text not null default '',
  model text not null default '',
  body text not null default 'SUV',
  price numeric not null default 0,
  year integer not null default 0,
  km integer not null default 0,
  discount numeric not null default 0,
  engine text not null default '',
  fuel text not null default '',
  arrival_port text not null default '',
  weight text not null default '',
  trans text not null default '',
  drive text not null default '',
  wheel text not null default '',
  images text[] not null default '{}',
  image text not null default '',
  status text not null default 'available' check (status in ('available','reserved','sold')),
  published boolean not null default true,
  reserved_at timestamptz,
  reserved_until timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.drive_cars add column if not exists stock text not null default '';
alter table public.drive_cars add column if not exists views bigint not null default 0;
alter table public.drive_cars add column if not exists weight text not null default '';
alter table public.drive_cars add column if not exists fuel text not null default '';
alter table public.drive_cars add column if not exists arrival_port text not null default '';
alter table public.drive_cars add column if not exists published boolean not null default true;
alter table public.drive_cars enable row level security;

create or replace function public.drive_cars_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end; $$;

drop trigger if exists drive_cars_updated_at on public.drive_cars;
create trigger drive_cars_updated_at before update on public.drive_cars
for each row execute function public.drive_cars_set_updated_at();

drop policy if exists "Public can read drive cars" on public.drive_cars;
create policy "Public can read drive cars" on public.drive_cars
for select to anon, authenticated using (true);

drop policy if exists "Admins can insert drive cars" on public.drive_cars;
create policy "Admins can insert drive cars" on public.drive_cars
for insert to authenticated with check (public.is_current_user_admin());

drop policy if exists "Admins can update drive cars" on public.drive_cars;
create policy "Admins can update drive cars" on public.drive_cars
for update to authenticated using (public.is_current_user_admin()) with check (public.is_current_user_admin());

drop policy if exists "Admins can delete drive cars" on public.drive_cars;
create policy "Admins can delete drive cars" on public.drive_cars
for delete to authenticated using (public.is_current_user_admin());

alter table public.drive_cars replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.drive_cars;
exception when duplicate_object then null;
end $$;


-- Incrementa visualizações sem permitir que o cliente altere outros dados do anúncio.
create or replace function public.increment_car_view(p_car_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.drive_cars set views = coalesce(views,0) + 1 where id = p_car_id and published = true;
$$;

revoke all on function public.increment_car_view(text) from public;
grant execute on function public.increment_car_view(text) to anon, authenticated;
