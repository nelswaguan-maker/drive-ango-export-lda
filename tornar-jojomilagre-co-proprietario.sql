-- DRIVE — adicionar jojomilagre@gmail.com como Proprietário Principal
-- Executar DEPOIS de supabase-schema.sql, supabase-security-hardening.sql
-- e do SQL anterior dos proprietários.

create or replace function public.is_owner_email(p_email text)
returns boolean
language sql immutable security definer set search_path = public, auth
as $$
  select lower(coalesce(p_email,'')) in (
    lower('nelswaguan@gmail.com'),
    lower('editojosejoaquim812@gmail.com'),
    lower('jojomilagre@gmail.com')
  );
$$;

revoke all on function public.is_owner_email(text) from public;
grant execute on function public.is_owner_email(text) to authenticated;

update public.profiles p
set role='admin', blocked=false, updated_at=now()
where p.id in (
  select u.id from auth.users u where public.is_owner_email(u.email)
);

insert into public.admin_permissions(user_id,publish,edit,manage_status,"delete")
select u.id,true,true,true,true
from auth.users u
where public.is_owner_email(u.email)
on conflict(user_id) do update set
  publish=true, edit=true, manage_status=true, "delete"=true, updated_at=now();

create or replace function public.is_current_user_admin()
returns boolean language sql security definer set search_path = public, auth stable as $$
  select public.is_owner_email((select email from auth.users where id=auth.uid()))
  or exists (
    select 1 from public.profiles p
    where p.id=auth.uid() and p.role='admin' and p.blocked=false
  );
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
create trigger protect_profile_privileges
before insert or update on public.profiles
for each row execute function public.protect_profile_privileges();

create or replace function public.admin_has_permission(p_permission text)
returns boolean language sql security definer set search_path = public, auth stable as $$
  select public.is_owner_email((select email from auth.users where id=auth.uid()))
  or exists (
    select 1
    from public.profiles p
    join public.admin_permissions ap on ap.user_id=p.id
    where p.id=auth.uid() and p.role='admin' and p.blocked=false
      and case p_permission
        when 'publish' then ap.publish
        when 'edit' then ap.edit
        when 'manage_status' then ap.manage_status
        when 'delete' then ap."delete"
        else false
      end
  );
$$;

revoke all on function public.admin_has_permission(text) from public;
grant execute on function public.admin_has_permission(text) to authenticated;

-- Os três proprietários podem usar o painel com acesso total.
