-- DRIVE — Convites de administradores: validade de 24 horas
-- IMPORTANTE: isto elimina SOMENTE os convites antigos. Não elimina administradores nem contas.

-- 1) Eliminar todos os convites existentes (pendentes, aceites, expirados ou cancelados).
delete from public.admin_invites;

-- 2) Fazer com que novos registos tenham validade padrão de 24 horas.
alter table public.admin_invites
  alter column expires_at set default (now() + interval '24 hours');

-- 3) Criar convites novos sempre com 24 horas de validade.
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
  new_token uuid;
  new_exp timestamptz;
begin
  if not public.is_owner_email((select email from auth.users where id=auth.uid())) then
    raise exception 'Apenas um Proprietário Principal pode criar convites';
  end if;

  if regexp_replace(coalesce(p_phone,''),'[^0-9]','','g') !~ '^[0-9]{9,15}$' then
    raise exception 'Número de WhatsApp inválido';
  end if;

  new_token := gen_random_uuid();
  new_exp := now() + interval '24 hours';

  insert into public.admin_invites(token,phone,permissions,created_by,expires_at)
  values(new_token,trim(p_phone),coalesce(p_permissions,'{}'::jsonb),auth.uid(),new_exp);

  return query select new_token,new_exp;
end;
$$;

revoke all on function public.create_admin_invite(text,jsonb) from public;
grant execute on function public.create_admin_invite(text,jsonb) to authenticated;
