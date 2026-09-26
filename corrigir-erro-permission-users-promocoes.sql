-- CORREÇÃO: permission denied for table users
-- Executar no Supabase SQL Editor.
-- A causa é que as policies de promoções/pedidos consultam auth.users diretamente.
-- Esta função SECURITY DEFINER faz essa consulta com segurança.

create or replace function public.is_current_user_owner()
returns boolean
language sql
security definer
stable
set search_path = public, auth
as $$
  select public.is_owner_email(
    (select u.email from auth.users u where u.id = auth.uid())
  );
$$;

revoke all on function public.is_current_user_owner() from public;
grant execute on function public.is_current_user_owner() to authenticated;

-- Promoções
drop policy if exists "Proprietários podem criar promoções" on public.drive_promotions;
create policy "Proprietários podem criar promoções"
on public.drive_promotions for insert to authenticated
with check (public.is_current_user_owner());

drop policy if exists "Proprietários podem atualizar promoções" on public.drive_promotions;
create policy "Proprietários podem atualizar promoções"
on public.drive_promotions for update to authenticated
using (public.is_current_user_owner())
with check (public.is_current_user_owner());

drop policy if exists "Proprietários podem apagar promoções" on public.drive_promotions;
create policy "Proprietários podem apagar promoções"
on public.drive_promotions for delete to authenticated
using (public.is_current_user_owner());

-- Pedidos: mesma correção para evitar o mesmo erro nessa área.
drop policy if exists "Clientes podem ver os próprios pedidos" on public.purchase_orders;
create policy "Clientes podem ver os próprios pedidos"
on public.purchase_orders for select to authenticated
using (customer_id = auth.uid() or public.is_current_user_owner());

drop policy if exists "Proprietários podem atualizar pedidos" on public.purchase_orders;
create policy "Proprietários podem atualizar pedidos"
on public.purchase_orders for update to authenticated
using (public.is_current_user_owner())
with check (public.is_current_user_owner());

drop policy if exists "Proprietários podem apagar pedidos" on public.purchase_orders;
create policy "Proprietários podem apagar pedidos"
on public.purchase_orders for delete to authenticated
using (public.is_current_user_owner());

-- Verificação rápida (deve retornar true para um dos 3 proprietários principais).
select public.is_current_user_owner() as sou_proprietario;
