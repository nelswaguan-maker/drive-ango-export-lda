-- DRIVE — Proprietários Principais
-- Proprietários principais: nelswaguan@gmail.com, editojosejoaquim812@gmail.com e jojomilagre@gmail.com
-- Executar DEPOIS do supabase-schema.sql e do supabase-security-hardening.sql.

create or replace function public.is_owner_email(p_email text)
returns boolean
language sql immutable security definer set search_path = public, auth
as $$
  select lower(coalesce(p_email,'')) in (lower('nelswaguan@gmail.com'), lower('editojosejoaquim812@gmail.com'), lower('jojomilagre@gmail.com'));
$$;
revoke all on function public.is_owner_email(text) from public;
grant execute on function public.is_owner_email(text) to authenticated;

-- Promover as contas dos proprietários (se já existirem).
update public.profiles p
set role='admin', blocked=false, updated_at=now()
where p.id in (select u.id from auth.users u where public.is_owner_email(u.email));

-- Os proprietários recebem acesso total como o primeiro.
insert into public.admin_permissions(user_id,publish,edit,manage_status,"delete")
select u.id,true,true,true,true
from auth.users u
where lower(u.email) in (lower('editojosejoaquim812@gmail.com'), lower('jojomilagre@gmail.com'))
on conflict(user_id) do update set publish=true,edit=true,manage_status=true,"delete"=true,updated_at=now();

create or replace function public.is_current_user_admin()
returns boolean language sql security definer set search_path = public, auth stable as $$
  select public.is_owner_email((select email from auth.users where id=auth.uid()))
  or exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin' and p.blocked=false);
$$;
revoke all on function public.is_current_user_admin() from public;
grant execute on function public.is_current_user_admin() to authenticated;

create or replace function public.protect_profile_privileges()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_owner_email((select email from auth.users where id=auth.uid())) then
    if tg_op='INSERT' then
      new.role := 'client'; new.blocked := false;
      new.email := (select email from auth.users where id=new.id);
    else
      new.role := old.role; new.blocked := old.blocked; new.email := old.email;
    end if;
  else
    if public.is_owner_email((select email from auth.users where id=new.id)) then
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
  select public.is_owner_email((select email from auth.users where id=auth.uid())) or exists (
    select 1 from public.profiles p join public.admin_permissions ap on ap.user_id=p.id
    where p.id=auth.uid() and p.role='admin' and p.blocked=false
      and case p_permission when 'publish' then ap.publish when 'edit' then ap.edit when 'manage_status' then ap.manage_status when 'delete' then ap."delete" else false end
  );
$$;
revoke all on function public.admin_has_permission(text) from public;
grant execute on function public.admin_has_permission(text) to authenticated;

create or replace function public.enforce_drive_car_permissions()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare owner_ok boolean := public.is_owner_email((select email from auth.users where id=auth.uid()));
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

-- Os proprietários podem gerir convites e administradores.
create or replace function public.create_admin_invite(p_phone text,p_permissions jsonb default '{"publish":true,"edit":true,"manageStatus":true,"delete":false}'::jsonb)
returns table(token uuid, expires_at timestamptz) language plpgsql security definer set search_path = public, auth as $$
declare new_token uuid; new_exp timestamptz;
begin
  if not public.is_owner_email((select email from auth.users where id=auth.uid())) then raise exception 'Apenas um Proprietário Principal pode criar convites'; end if;
  if regexp_replace(coalesce(p_phone,''),'[^0-9]','','g') !~ '^[0-9]{9,15}$' then raise exception 'Número de WhatsApp inválido'; end if;
  new_token:=gen_random_uuid(); new_exp:=now()+interval '7 days';
  insert into public.admin_invites(token,phone,permissions,created_by,expires_at) values(new_token,trim(p_phone),coalesce(p_permissions,'{}'::jsonb),auth.uid(),new_exp);
  return query select new_token,new_exp;
end; $$;
revoke all on function public.create_admin_invite(text,jsonb) from public; grant execute on function public.create_admin_invite(text,jsonb) to authenticated;

create or replace function public.accept_admin_invite(p_token uuid)
returns boolean language plpgsql security definer set search_path = public, auth as $$
declare inv public.admin_invites%rowtype; target_id uuid; target_email text; perm jsonb;
begin
  target_id:=auth.uid(); if target_id is null then raise exception 'Utilizador não autenticado'; end if;
  select * into inv from public.admin_invites where token=p_token for update;
  if not found then raise exception 'Convite inválido'; end if;
  if inv.status<>'pending' then if inv.status='accepted' and inv.accepted_by=target_id then return true; end if; raise exception 'Este convite já foi utilizado ou cancelado'; end if;
  if inv.expires_at<=now() then update public.admin_invites set status='expired' where id=inv.id; raise exception 'Este convite expirou'; end if;
  select email into target_email from auth.users where id=target_id;
  if public.is_owner_email(target_email) then
    update public.profiles set role='admin',blocked=false,updated_at=now() where id=target_id;
    update public.admin_invites set status='accepted',accepted_by=target_id,accepted_at=now() where id=inv.id;
    return true;
  end if;
  perm:=inv.permissions;
  update public.profiles set role='admin',blocked=false,updated_at=now() where id=target_id;
  insert into public.admin_permissions(user_id,publish,edit,manage_status,"delete") values(target_id,coalesce((perm->>'publish')::boolean,true),coalesce((perm->>'edit')::boolean,true),coalesce((perm->>'manageStatus')::boolean,true),coalesce((perm->>'delete')::boolean,false))
  on conflict(user_id) do update set publish=excluded.publish,edit=excluded.edit,manage_status=excluded.manage_status,"delete"=excluded."delete",updated_at=now();
  update public.admin_invites set status='accepted',accepted_by=target_id,accepted_at=now() where id=inv.id;
  return true;
end; $$;
revoke all on function public.accept_admin_invite(uuid) from public; grant execute on function public.accept_admin_invite(uuid) to authenticated;

create or replace function public.set_admin_blocked(p_user_id uuid,p_blocked boolean)
returns boolean language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_owner_email((select email from auth.users where id=auth.uid())) then raise exception 'Apenas um Proprietário Principal pode bloquear administradores'; end if;
  if public.is_owner_email((select email from auth.users where id=p_user_id)) then raise exception 'Um Proprietário Principal não pode ser bloqueado'; end if;
  update public.profiles set blocked=p_blocked,updated_at=now() where id=p_user_id and role='admin'; return found;
end; $$;
revoke all on function public.set_admin_blocked(uuid,boolean) from public; grant execute on function public.set_admin_blocked(uuid,boolean) to authenticated;

create or replace function public.remove_admin(p_user_id uuid)
returns boolean language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_owner_email((select email from auth.users where id=auth.uid())) then raise exception 'Apenas um Proprietário Principal pode remover administradores'; end if;
  if public.is_owner_email((select email from auth.users where id=p_user_id)) then raise exception 'Um Proprietário Principal não pode ser removido'; end if;
  update public.profiles set role='client',blocked=false,updated_at=now() where id=p_user_id; delete from public.admin_permissions where user_id=p_user_id; return found;
end; $$;
revoke all on function public.remove_admin(uuid) from public; grant execute on function public.remove_admin(uuid) to authenticated;

drop policy if exists "Proprietário pode ver convites" on public.admin_invites;
create policy "Proprietários podem ver convites" on public.admin_invites for select to authenticated using (public.is_owner_email((select email from auth.users where id=auth.uid())));

-- Storage: os proprietários têm acesso total; convidados continuam sujeitos às permissões.
drop policy if exists "Admins can upload car images" on storage.objects;
create policy "Admins can upload car images" on storage.objects for insert to authenticated with check (bucket_id='car-images' and public.admin_has_permission('publish'));
drop policy if exists "Admins can update car images" on storage.objects;
create policy "Admins can update car images" on storage.objects for update to authenticated using (bucket_id='car-images' and public.admin_has_permission('edit')) with check (bucket_id='car-images' and public.admin_has_permission('edit'));
drop policy if exists "Admins can delete car images" on storage.objects;
create policy "Admins can delete car images" on storage.objects for delete to authenticated using (bucket_id='car-images' and public.admin_has_permission('delete'));
