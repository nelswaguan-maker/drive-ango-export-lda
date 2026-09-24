-- DRIVE CARS — HARDENING DE SEGURANÇA
-- Executar DEPOIS do supabase-schema.sql numa instalação já existente.
-- Corrige a possibilidade de um utilizador comum elevar role/blocked e aplica
-- as permissões dos administradores convidados também no banco de dados.

create or replace function public.protect_profile_privileges()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  if lower(coalesce((select email from auth.users where id=auth.uid()),'')) <> lower('nelswaguan@gmail.com') then
    if tg_op='INSERT' then
      new.role := 'client'; new.blocked := false;
      new.email := (select email from auth.users where id=new.id);
    else
      new.role := old.role; new.blocked := old.blocked; new.email := old.email;
    end if;
  else
    if lower(coalesce((select email from auth.users where id=new.id),''))=lower('nelswaguan@gmail.com') then
      new.role := 'admin'; new.blocked := false;
      new.email := (select email from auth.users where id=new.id);
    end if;
  end if;
  return new;
end; $$;
revoke all on function public.protect_profile_privileges() from public;
drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges before insert or update on public.profiles for each row execute function public.protect_profile_privileges();

create or replace function public.admin_has_permission(p_permission text)
returns boolean language sql security definer set search_path = public, auth stable as $$
  select lower(coalesce((select email from auth.users where id=auth.uid()),''))=lower('nelswaguan@gmail.com') or exists (
    select 1 from public.profiles p join public.admin_permissions ap on ap.user_id=p.id
    where p.id=auth.uid() and p.role='admin' and p.blocked=false
      and case p_permission when 'publish' then ap.publish when 'edit' then ap.edit when 'manage_status' then ap.manage_status when 'delete' then ap."delete" else false end
  );
$$;
revoke all on function public.admin_has_permission(text) from public;
grant execute on function public.admin_has_permission(text) to authenticated;

create or replace function public.enforce_drive_car_permissions()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare owner_ok boolean := lower(coalesce((select email from auth.users where id=auth.uid()),''))=lower('nelswaguan@gmail.com');
begin
  if owner_ok then return new; end if;
  if tg_op='INSERT' then
    if not public.admin_has_permission('publish') then raise exception 'Sem permissão para publicar anúncios'; end if;
  elsif tg_op='UPDATE' then
    if (new.status is distinct from old.status or new.reserved_at is distinct from old.reserved_at or new.reserved_until is distinct from old.reserved_until) and not public.admin_has_permission('manage_status') then raise exception 'Sem permissão para alterar o estado do anúncio'; end if;
    if new.published is distinct from old.published and not public.admin_has_permission('publish') then raise exception 'Sem permissão para publicar/ocultar anúncios'; end if;
    if row(new.stock,new.brand,new.model,new.body,new.price,new.year,new.km,new.discount,new.engine,new.weight,new.trans,new.drive,new.wheel,new.images,new.image,new.created_by) is distinct from row(old.stock,old.brand,old.model,old.body,old.price,old.year,old.km,old.discount,old.engine,old.weight,old.trans,old.drive,old.wheel,old.images,old.image,old.created_by) and not public.admin_has_permission('edit') then raise exception 'Sem permissão para editar anúncios'; end if;
  end if;
  return new;
end; $$;
revoke all on function public.enforce_drive_car_permissions() from public;
drop trigger if exists enforce_drive_car_permissions on public.drive_cars;
create trigger enforce_drive_car_permissions before insert or update on public.drive_cars for each row execute function public.enforce_drive_car_permissions();

drop policy if exists "Admins can delete drive cars" on public.drive_cars;
create policy "Admins can delete drive cars" on public.drive_cars for delete to authenticated using (public.is_current_user_admin() and public.admin_has_permission('delete'));

-- Storage: aplicar as mesmas permissões às imagens.
drop policy if exists "Admins can upload car images" on storage.objects;
create policy "Admins can upload car images" on storage.objects for insert to authenticated with check (bucket_id='car-images' and public.is_current_user_admin() and public.admin_has_permission('publish'));
drop policy if exists "Admins can update car images" on storage.objects;
create policy "Admins can update car images" on storage.objects for update to authenticated using (bucket_id='car-images' and public.is_current_user_admin() and public.admin_has_permission('edit')) with check (bucket_id='car-images' and public.is_current_user_admin() and public.admin_has_permission('edit'));
drop policy if exists "Admins can delete car images" on storage.objects;
create policy "Admins can delete car images" on storage.objects for delete to authenticated using (bucket_id='car-images' and public.is_current_user_admin() and public.admin_has_permission('delete'));
