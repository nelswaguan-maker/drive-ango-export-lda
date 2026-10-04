-- DRIVE ANGO — CORREÇÃO DA LEITURA PÚBLICA DO CATÁLOGO
-- Motivo: a policy antiga fazia o utilizador anónimo depender de
-- is_current_user_admin(), função concedida apenas a authenticated.
-- Isso pode fazer a consulta pública do catálogo falhar quando existem
-- anúncios não publicados.

drop policy if exists "Public can read drive cars" on public.drive_cars;
drop policy if exists "Public can read published drive cars" on public.drive_cars;
drop policy if exists "Admins can read unpublished drive cars" on public.drive_cars;

create policy "Public can read published drive cars" on public.drive_cars
for select to anon, authenticated
using (published = true);

create policy "Admins can read unpublished drive cars" on public.drive_cars
for select to authenticated
using (public.is_current_user_admin());
