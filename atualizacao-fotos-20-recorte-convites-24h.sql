-- DRIVE — atualização 26/09/2026
-- 1) Convites de administrador passam a durar 24 horas.
-- 2) Convites antigos são eliminados. Nenhum carro, perfil ou promoção é apagado.
-- 3) Os 3 Proprietários Principais continuam com prioridade sobre administradores convidados.

alter table public.admin_invites
  alter column expires_at set default (now() + interval '24 hours');

-- Ajusta o prazo dos convites pendentes existentes para 24h desde a criação.
update public.admin_invites
set expires_at = created_at + interval '24 hours'
where status='pending';

-- Elimina somente registos antigos da tabela de convites.
delete from public.admin_invites
where created_at < now() - interval '24 hours';

-- Lista oficial dos Proprietários Principais.
create or replace function public.drive_is_owner(p_email text)
returns boolean
language sql
immutable
as $$
  select lower(trim(coalesce(p_email,''))) in (
    lower('nelswaguan@gmail.com'),
    lower('editojosejoaquim812@gmail.com'),
    lower('jojomilagre@gmail.com')
  );
$$;

-- Criação de convites: somente os 3 Proprietários Principais.
create or replace function public.create_admin_invite(
  p_phone text,
  p_permissions jsonb default '{"publish":true,"edit":true,"manageStatus":true,"delete":false}'::jsonb
)
returns table(token uuid, expires_at timestamptz)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  owner_ok boolean;
  new_token uuid;
  new_exp timestamptz;
begin
  owner_ok := public.drive_is_owner((select email from auth.users where id=auth.uid()));
  if not owner_ok then
    raise exception 'Apenas um Proprietário Principal pode criar convites';
  end if;

  if regexp_replace(coalesce(p_phone,''),'[^0-9]','','g') !~ '^[0-9]{9,15}$' then
    raise exception 'Número de WhatsApp inválido';
  end if;

  -- Limpa convites antigos que já ultrapassaram as 24h antes de criar outro.
  delete from public.admin_invites
  where created_at < now() - interval '24 hours'
     or expires_at <= now();

  new_token := gen_random_uuid();
  new_exp := now()+interval '24 hours';

  insert into public.admin_invites(token,phone,permissions,created_by,expires_at)
  values(new_token,trim(p_phone),coalesce(p_permissions,'{}'::jsonb),auth.uid(),new_exp);

  return query select new_token,new_exp;
end;
$$;

revoke all on function public.create_admin_invite(text,jsonb) from public;
grant execute on function public.create_admin_invite(text,jsonb) to authenticated;

-- Aceitação continua protegida: proprietário nunca vira subordinado de um convite.
create or replace function public.accept_admin_invite(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  inv public.admin_invites%rowtype;
  target_id uuid;
  target_email text;
  perm jsonb;
begin
  target_id := auth.uid();
  if target_id is null then raise exception 'Utilizador não autenticado'; end if;

  select * into inv from public.admin_invites where token=p_token for update;
  if not found then raise exception 'Convite inválido'; end if;

  if inv.status <> 'pending' then
    if inv.status='accepted' and inv.accepted_by=target_id then return true; end if;
    raise exception 'Este convite já foi utilizado ou cancelado';
  end if;

  if inv.expires_at <= now() then
    delete from public.admin_invites where id=inv.id;
    raise exception 'Este convite expirou';
  end if;

  select email into target_email from auth.users where id=target_id;

  if public.drive_is_owner(target_email) then
    delete from public.admin_invites where id=inv.id;
    return true;
  end if;

  perm := inv.permissions;
  update public.profiles set role='admin',blocked=false,updated_at=now() where id=target_id;

  insert into public.admin_permissions(user_id,publish,edit,manage_status,"delete")
  values(
    target_id,
    coalesce((perm->>'publish')::boolean,true),
    coalesce((perm->>'edit')::boolean,true),
    coalesce((perm->>'manageStatus')::boolean,true),
    coalesce((perm->>'delete')::boolean,false)
  )
  on conflict(user_id) do update set
    publish=excluded.publish,
    edit=excluded.edit,
    manage_status=excluded.manage_status,
    "delete"=excluded."delete",
    updated_at=now();

  delete from public.admin_invites where id=inv.id;
  return true;
end;
$$;

revoke all on function public.accept_admin_invite(uuid) from public;
grant execute on function public.accept_admin_invite(uuid) to authenticated;

-- Garante os 3 Proprietários Principais como administradores nos perfis existentes.
insert into public.profiles (id,name,email,role,blocked)
select u.id,
       coalesce(u.raw_user_meta_data->>'name','Proprietário Principal'),
       u.email,
       'admin',
       false
from auth.users u
where public.drive_is_owner(u.email)
on conflict (id) do update set
  email=excluded.email,
  role='admin',
  blocked=false,
  updated_at=now();

-- Função usada pelas políticas/RPCs: qualquer um dos 3 proprietários é administrador.
create or replace function public.is_current_user_admin()
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id=auth.uid() and p.role='admin' and p.blocked=false
  )
  or public.drive_is_owner((select email from auth.users where id=auth.uid()));
$$;

grant execute on function public.is_current_user_admin() to authenticated;
