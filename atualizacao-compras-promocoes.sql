-- DRIVE ANGO EXPORT — atualização: BUY NOW, pedidos aos Proprietários e promoções
-- Execute este ficheiro no Supabase > SQL Editor.

-- Novas especificações dos veículos
alter table public.drive_cars add column if not exists color text not null default '';
alter table public.drive_cars add column if not exists location text not null default '';
alter table public.drive_cars add column if not exists seats text not null default '';
alter table public.drive_cars add column if not exists doors text not null default '';
alter table public.drive_cars add column if not exists dimensions text not null default '';

-- Proprietários Principais
create or replace function public.is_owner_email(p_email text)
returns boolean language sql immutable as $$
  select lower(coalesce(p_email,'')) in (
    lower('nelswaguan@gmail.com'),
    lower('editojosejoaquim812@gmail.com'),
    lower('jojomilagre@gmail.com')
  );
$$;
revoke all on function public.is_owner_email(text) from public;
grant execute on function public.is_owner_email(text) to anon, authenticated;

-- Pedidos de compra
create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  car_id text references public.drive_cars(id) on delete set null,
  customer_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null default '',
  customer_email text not null default '',
  customer_phone text not null default '',
  country text not null default 'Moçambique',
  destination text not null default '',
  shipping_method text not null default 'RORO',
  payment_method text not null default '',
  insurance text not null default 'Sim',
  inspection text not null default 'Sim',
  warranty text not null default 'Sim',
  coupon text not null default '',
  notes text not null default '',
  vehicle_snapshot jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','confirmed','cancelled','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.purchase_orders enable row level security;

drop policy if exists "Clientes podem criar os próprios pedidos" on public.purchase_orders;
create policy "Clientes podem criar os próprios pedidos" on public.purchase_orders
for insert to authenticated with check (customer_id=auth.uid());

drop policy if exists "Clientes podem ver os próprios pedidos" on public.purchase_orders;
create policy "Clientes podem ver os próprios pedidos" on public.purchase_orders
for select to authenticated using (customer_id=auth.uid() or public.is_owner_email((select email from auth.users where id=auth.uid())));

drop policy if exists "Proprietários podem atualizar pedidos" on public.purchase_orders;
create policy "Proprietários podem atualizar pedidos" on public.purchase_orders
for update to authenticated using (public.is_owner_email((select email from auth.users where id=auth.uid()))) with check (public.is_owner_email((select email from auth.users where id=auth.uid())));

do $$ begin alter publication supabase_realtime add table public.purchase_orders; exception when duplicate_object then null; end $$;

-- Promoções publicadas pelos proprietários
create table if not exists public.drive_promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text not null default '',
  image_url text not null default '',
  car_id text references public.drive_cars(id) on delete set null,
  old_price numeric,
  promo_price numeric,
  discount numeric not null default 0,
  active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.drive_promotions enable row level security;
drop policy if exists "Promoções públicas ativas" on public.drive_promotions;
create policy "Promoções públicas ativas" on public.drive_promotions for select to anon, authenticated using (active=true and starts_at<=now() and (ends_at is null or ends_at>=now()));
drop policy if exists "Proprietários gerem promoções" on public.drive_promotions;
create policy "Proprietários gerem promoções" on public.drive_promotions for all to authenticated using (public.is_owner_email((select email from auth.users where id=auth.uid()))) with check (public.is_owner_email((select email from auth.users where id=auth.uid())));
do $$ begin alter publication supabase_realtime add table public.drive_promotions; exception when duplicate_object then null; end $$;

-- Atualização automática de updated_at
create or replace function public.drive_purchase_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists purchase_orders_updated_at on public.purchase_orders;
create trigger purchase_orders_updated_at before update on public.purchase_orders for each row execute function public.drive_purchase_updated_at();
drop trigger if exists drive_promotions_updated_at on public.drive_promotions;
create trigger drive_promotions_updated_at before update on public.drive_promotions for each row execute function public.drive_purchase_updated_at();
