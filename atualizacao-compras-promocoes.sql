-- DRIVE ANGO EXPORT — BUY NOW, PEDIDOS, PROMOÇÕES E PROPRIETÁRIOS
-- Versão segura e idempotente para Supabase

create extension if not exists pgcrypto;

alter table public.drive_cars add column if not exists color text not null default '';
alter table public.drive_cars add column if not exists location text not null default '';
alter table public.drive_cars add column if not exists seats text not null default '';
alter table public.drive_cars add column if not exists doors text not null default '';
alter table public.drive_cars add column if not exists dimensions text not null default '';

create or replace function public.is_owner_email(p_email text)
returns boolean language sql immutable security definer set search_path = public as $$
  select lower(trim(coalesce(p_email,''))) in (
    'nelswaguan@gmail.com',
    'editojosejoaquim812@gmail.com',
    'jojomilagre@gmail.com'
  );
$$;
revoke all on function public.is_owner_email(text) from public;
grant execute on function public.is_owner_email(text) to anon, authenticated;

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
create policy "Clientes podem criar os próprios pedidos" on public.purchase_orders for insert to authenticated with check (customer_id=auth.uid());
drop policy if exists "Clientes podem ver os próprios pedidos" on public.purchase_orders;
create policy "Clientes podem ver os próprios pedidos" on public.purchase_orders for select to authenticated using (customer_id=auth.uid() or public.is_owner_email((select email from auth.users where id=auth.uid())));
drop policy if exists "Proprietários podem atualizar pedidos" on public.purchase_orders;
create policy "Proprietários podem atualizar pedidos" on public.purchase_orders for update to authenticated using (public.is_owner_email((select email from auth.users where id=auth.uid()))) with check (public.is_owner_email((select email from auth.users where id=auth.uid())));
drop policy if exists "Proprietários podem apagar pedidos" on public.purchase_orders;
create policy "Proprietários podem apagar pedidos" on public.purchase_orders for delete to authenticated using (public.is_owner_email((select email from auth.users where id=auth.uid())));

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
drop policy if exists "Proprietários podem criar promoções" on public.drive_promotions;
create policy "Proprietários podem criar promoções" on public.drive_promotions for insert to authenticated with check (public.is_owner_email((select email from auth.users where id=auth.uid())));
drop policy if exists "Proprietários podem atualizar promoções" on public.drive_promotions;
create policy "Proprietários podem atualizar promoções" on public.drive_promotions for update to authenticated using (public.is_owner_email((select email from auth.users where id=auth.uid()))) with check (public.is_owner_email((select email from auth.users where id=auth.uid())));
drop policy if exists "Proprietários podem apagar promoções" on public.drive_promotions;
create policy "Proprietários podem apagar promoções" on public.drive_promotions for delete to authenticated using (public.is_owner_email((select email from auth.users where id=auth.uid())));

do $$ begin alter publication supabase_realtime add table public.purchase_orders; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.drive_promotions; exception when duplicate_object then null; end $$;

create or replace function public.drive_purchase_updated_at() returns trigger language plpgsql security invoker set search_path=public as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists purchase_orders_updated_at on public.purchase_orders;
create trigger purchase_orders_updated_at before update on public.purchase_orders for each row execute function public.drive_purchase_updated_at();
drop trigger if exists drive_promotions_updated_at on public.drive_promotions;
create trigger drive_promotions_updated_at before update on public.drive_promotions for each row execute function public.drive_purchase_updated_at();

create index if not exists idx_purchase_orders_customer_id on public.purchase_orders(customer_id);
create index if not exists idx_purchase_orders_car_id on public.purchase_orders(car_id);
create index if not exists idx_purchase_orders_status on public.purchase_orders(status);
create index if not exists idx_purchase_orders_created_at on public.purchase_orders(created_at desc);
create index if not exists idx_drive_promotions_active on public.drive_promotions(active);
create index if not exists idx_drive_promotions_car_id on public.drive_promotions(car_id);
create index if not exists idx_drive_promotions_starts_at on public.drive_promotions(starts_at);
create index if not exists idx_drive_promotions_ends_at on public.drive_promotions(ends_at);

select 'DRIVE ANGO EXPORT SQL executado com sucesso' as resultado;
