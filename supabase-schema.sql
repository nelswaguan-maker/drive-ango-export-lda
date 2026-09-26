-- DRIVE CARS — SUPABASE / ADMINISTRAÇÃO
-- Execute este ficheiro inteiro no Supabase > SQL Editor.
-- Este SQL substitui o fluxo antigo de convites guardados apenas no localStorage.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Cliente',
  phone text,
  email text,
  role text not null default 'client',
  blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.profiles add column if not exists role text not null default 'client';
alter table public.profiles add column if not exists blocked boolean not null default false;
alter table public.profiles add column if not exists privacy_accepted_at timestamptz;
alter table public.profiles add column if not exists terms_accepted_at timestamptz;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('client','admin'));

-- Permissões dos administradores convidados.
create table if not exists public.admin_permissions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  publish boolean not null default true,
  edit boolean not null default true,
  manage_status boolean not null default true,
  "delete" boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.admin_permissions enable row level security;

-- Convites reais, guardados no Supabase e não no navegador do proprietário.
create table if not exists public.admin_invites (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  phone text not null,
  permissions jsonb not null default '{"publish":true,"edit":true,"manageStatus":true,"delete":false}'::jsonb,
  status text not null default 'pending' check (status in ('pending','accepted','expired','cancelled')),
  created_by uuid not null references auth.users(id) on delete cascade,
  accepted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz
);
alter table public.admin_invites enable row level security;

-- Perfil automático ao criar conta.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id,name,phone,email,role,blocked)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name','Cliente'),
    new.raw_user_meta_data->>'phone',
    new.email,
    case when lower(coalesce(new.email,''))=lower('nelswaguan@gmail.com') then 'admin' else 'client' end,
    false
  )
  on conflict (id) do update set
    name=excluded.name,
    phone=excluded.phone,
    email=excluded.email,
    privacy_accepted_at=coalesce(excluded.privacy_accepted_at, public.profiles.privacy_accepted_at),
    terms_accepted_at=coalesce(excluded.terms_accepted_at, public.profiles.terms_accepted_at),
    role=case
      when lower(coalesce(excluded.email,''))=lower('nelswaguan@gmail.com') then 'admin'
      else public.profiles.role
    end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_profile_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at=now();
  return new;
end;
$$;
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_profile_updated_at();

-- Administrador principal.
update public.profiles p
set role='admin', blocked=false, updated_at=now()
where p.id in (
  select u.id from auth.users u
  where lower(u.email)=lower('nelswaguan@gmail.com')
);

-- Função usada pelo site para saber se a sessão é administradora.
create or replace function public.is_current_user_admin()
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id=auth.uid()
      and p.role='admin'
      and p.blocked=false
  )
  or exists (
    select 1 from auth.users u
    where u.id=auth.uid()
      and lower(u.email)=lower('nelswaguan@gmail.com')
  );
$$;
revoke all on function public.is_current_user_admin() from public;
grant execute on function public.is_current_user_admin() to authenticated;

-- Políticas de perfis.
drop policy if exists "Clientes podem ver o próprio perfil" on public.profiles;
drop policy if exists "Clientes podem criar o próprio perfil" on public.profiles;
drop policy if exists "Clientes podem atualizar o próprio perfil" on public.profiles;
drop policy if exists "Administradores podem ler perfis" on public.profiles;

create policy "Clientes podem ver o próprio perfil"
on public.profiles for select to authenticated
using (auth.uid()=id or public.is_current_user_admin());

create policy "Clientes podem criar o próprio perfil"
on public.profiles for insert to authenticated
with check (auth.uid()=id);

create policy "Clientes podem atualizar o próprio perfil"
on public.profiles for update to authenticated
using (
  auth.uid()=id
  or public.is_current_user_admin()
)
with check (
  auth.uid()=id
  or public.is_current_user_admin()
);

-- Proteção adicional: um utilizador/admin convidado não pode alterar diretamente
-- role, blocked ou email para obter privilégios. Apenas o Proprietário Principal
-- pode alterar esses campos através das funções administrativas.
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if lower(coalesce((select email from auth.users where id=auth.uid()),'')) <> lower('nelswaguan@gmail.com') then
    if tg_op = 'INSERT' then
      new.role := 'client';
      new.blocked := false;
      new.email := (select email from auth.users where id = new.id);
    elsif tg_op = 'UPDATE' then
      new.role := old.role;
      new.blocked := old.blocked;
      new.email := old.email;
    end if;
  else
    if lower(coalesce((select email from auth.users where id = new.id),'')) = lower('nelswaguan@gmail.com') then
      new.role := 'admin';
      new.blocked := false;
      new.email := (select email from auth.users where id = new.id);
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.protect_profile_privileges() from public;
drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
before insert or update on public.profiles
for each row execute function public.protect_profile_privileges();

-- Só o próprio utilizador vê as suas permissões; o proprietário vê todas.
drop policy if exists "Admin pode ler permissões" on public.admin_permissions;
create policy "Admin pode ler permissões"
on public.admin_permissions for select to authenticated
using (user_id=auth.uid() or public.is_current_user_admin());

-- Não é permitido ao browser inserir/alterar permissões diretamente.
drop policy if exists "Sem escrita direta de permissões" on public.admin_permissions;

-- O proprietário pode criar um convite. O token fica no Supabase.
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
  owner_ok := exists(
    select 1 from auth.users
    where id=auth.uid()
      and lower(email)=lower('nelswaguan@gmail.com')
  );
  if not owner_ok then
    raise exception 'Apenas o Proprietário Principal pode criar convites';
  end if;

  if regexp_replace(coalesce(p_phone,''),'[^0-9]','','g') !~ '^[0-9]{9,15}$' then
    raise exception 'Número de WhatsApp inválido';
  end if;

  new_token := gen_random_uuid();
  new_exp := now()+interval '7 days';

  insert into public.admin_invites(token,phone,permissions,created_by,expires_at)
  values(new_token,trim(p_phone),coalesce(p_permissions,'{}'::jsonb),auth.uid(),new_exp);

  return query select new_token,new_exp;
end;
$$;
revoke all on function public.create_admin_invite(text,jsonb) from public;
grant execute on function public.create_admin_invite(text,jsonb) to authenticated;

-- O convidado usa o token depois de criar/confirmar a conta.
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
  if target_id is null then
    raise exception 'Utilizador não autenticado';
  end if;

  select * into inv
  from public.admin_invites
  where token=p_token
  for update;

  if not found then
    raise exception 'Convite inválido';
  end if;

  if inv.status <> 'pending' then
    if inv.status = 'accepted' and inv.accepted_by = target_id then
      return true;
    end if;
    raise exception 'Este convite já foi utilizado ou cancelado';
  end if;

  if inv.expires_at <= now() then
    update public.admin_invites set status='expired' where id=inv.id;
    raise exception 'Este convite expirou';
  end if;

  select email into target_email from auth.users where id=target_id;

  if lower(coalesce(target_email,''))=lower('nelswaguan@gmail.com') then
    -- O proprietário já é administrador.
    update public.admin_invites
      set status='accepted',accepted_by=target_id,accepted_at=now()
      where id=inv.id;
    return true;
  end if;

  perm := inv.permissions;

  update public.profiles
  set role='admin',blocked=false,updated_at=now()
  where id=target_id;

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

  update public.admin_invites
  set status='accepted',accepted_by=target_id,accepted_at=now()
  where id=inv.id;

  return true;
end;
$$;
revoke all on function public.accept_admin_invite(uuid) from public;
grant execute on function public.accept_admin_invite(uuid) to authenticated;

-- Bloquear/desbloquear administrador.
create or replace function public.set_admin_blocked(p_user_id uuid,p_blocked boolean)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not exists(select 1 from auth.users where id=auth.uid() and lower(email)=lower('nelswaguan@gmail.com')) then
    raise exception 'Apenas o Proprietário Principal pode bloquear administradores';
  end if;
  if exists(select 1 from auth.users where id=p_user_id and lower(email)=lower('nelswaguan@gmail.com')) then
    raise exception 'O proprietário principal não pode ser bloqueado';
  end if;
  update public.profiles set blocked=p_blocked,updated_at=now()
  where id=p_user_id and role='admin';
  return found;
end;
$$;
revoke all on function public.set_admin_blocked(uuid,boolean) from public;
grant execute on function public.set_admin_blocked(uuid,boolean) to authenticated;

-- Remover acesso de administrador sem apagar a conta.
create or replace function public.remove_admin(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not exists(select 1 from auth.users where id=auth.uid() and lower(email)=lower('nelswaguan@gmail.com')) then
    raise exception 'Apenas o Proprietário Principal pode remover administradores';
  end if;
  if exists(select 1 from auth.users where id=p_user_id and lower(email)=lower('nelswaguan@gmail.com')) then
    raise exception 'O proprietário principal não pode ser removido';
  end if;
  update public.profiles set role='client',blocked=false,updated_at=now()
  where id=p_user_id;
  delete from public.admin_permissions where user_id=p_user_id;
  return found;
end;
$$;
revoke all on function public.remove_admin(uuid) from public;
grant execute on function public.remove_admin(uuid) to authenticated;

-- O proprietário vê os convites; convidados não conseguem listar tokens.
drop policy if exists "Proprietário pode ver convites" on public.admin_invites;
create policy "Proprietário pode ver convites"
on public.admin_invites for select to authenticated
using (
  exists(
    select 1 from auth.users
    where id=auth.uid() and lower(email)=lower('nelswaguan@gmail.com')
  )
);

-- Eliminar a própria conta.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Utilizador não autenticado';
  end if;
  delete from auth.users where id=auth.uid();
  if not found then
    raise exception 'Conta não encontrada';
  end if;
end;
$$;
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- ============================================================
-- DRIVE CARS: catálogo partilhado entre Proprietário e ADMINS
-- ============================================================
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

alter table public.drive_cars add column if not exists weight text not null default '';
alter table public.drive_cars add column if not exists stock text not null default '';
alter table public.drive_cars add column if not exists views bigint not null default 0;
alter table public.drive_cars add column if not exists published boolean not null default true;
alter table public.drive_cars replica identity full;
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

-- Acesso de escrita respeita as permissões do administrador convidado.
create or replace function public.admin_has_permission(p_permission text)
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select lower(coalesce((select email from auth.users where id=auth.uid()),''))=lower('nelswaguan@gmail.com')
    or exists (
      select 1 from public.profiles p
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

create or replace function public.enforce_drive_car_permissions()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  owner_ok boolean := lower(coalesce((select email from auth.users where id=auth.uid()),''))=lower('nelswaguan@gmail.com');
  edit_ok boolean := public.admin_has_permission('edit');
  status_ok boolean := public.admin_has_permission('manage_status');
  publish_ok boolean := public.admin_has_permission('publish');
begin
  if owner_ok then return new; end if;
  if tg_op = 'INSERT' then
    if not publish_ok then raise exception 'Sem permissão para publicar anúncios'; end if;
    return new;
  end if;
  if tg_op = 'UPDATE' then
    if new.status is distinct from old.status
       or new.reserved_at is distinct from old.reserved_at
       or new.reserved_until is distinct from old.reserved_until then
      if not status_ok then raise exception 'Sem permissão para alterar o estado do anúncio'; end if;
    end if;
    if new.published is distinct from old.published then
      if not publish_ok then raise exception 'Sem permissão para publicar/ocultar anúncios'; end if;
    end if;
    if row(
      new.stock,new.brand,new.model,new.body,new.price,new.year,new.km,new.discount,
      new.engine,new.weight,new.trans,new.drive,new.wheel,new.images,new.image,new.created_by
    ) is distinct from row(
      old.stock,old.brand,old.model,old.body,old.price,old.year,old.km,old.discount,
      old.engine,old.weight,old.trans,old.drive,old.wheel,old.images,old.image,old.created_by
    ) then
      if not edit_ok then raise exception 'Sem permissão para editar anúncios'; end if;
    end if;
    return new;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_drive_car_permissions() from public;
drop trigger if exists enforce_drive_car_permissions on public.drive_cars;
create trigger enforce_drive_car_permissions
before insert or update on public.drive_cars
for each row execute function public.enforce_drive_car_permissions();

drop policy if exists "Admins can insert drive cars" on public.drive_cars;
create policy "Admins can insert drive cars" on public.drive_cars
for insert to authenticated with check (public.is_current_user_admin());

drop policy if exists "Admins can update drive cars" on public.drive_cars;
create policy "Admins can update drive cars" on public.drive_cars
for update to authenticated using (public.is_current_user_admin()) with check (public.is_current_user_admin());

drop policy if exists "Admins can delete drive cars" on public.drive_cars;
create policy "Admins can delete drive cars" on public.drive_cars
for delete to authenticated using (public.is_current_user_admin() and public.admin_has_permission('delete'));

-- Ativa as mudanças em tempo real para que Proprietário, ADM e página inicial
-- recebam imediatamente novas publicações/edições/status.
do $$
begin
  alter publication supabase_realtime add table public.drive_cars;
exception when duplicate_object then null;
end $$;


create or replace function public.increment_car_view(p_car_id text)
returns void language sql security definer set search_path = public as $$
  update public.drive_cars set views = coalesce(views,0) + 1 where id = p_car_id and published = true;
$$;
revoke all on function public.increment_car_view(text) from public;
grant execute on function public.increment_car_view(text) to anon, authenticated;


-- DRIVE CARS: novos campos do anúncio (cilindrada, combustível e porto de chegada)
alter table if exists public.drive_cars add column if not exists fuel text not null default '';
alter table if exists public.drive_cars add column if not exists arrival_port text not null default '';
-- DRIVE — contador global de pesquisas/cliques por modelo
-- Execute uma vez no Supabase > SQL Editor.
create table if not exists public.drive_model_views (
  model_key text primary key,
  brand text not null,
  model text not null,
  image text not null default '',
  views bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.drive_model_views enable row level security;

create or replace function public.record_model_view(
  p_brand text,
  p_model text,
  p_image text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_brand text := trim(coalesce(p_brand,''));
  v_model text := trim(coalesce(p_model,''));
  v_key text;
begin
  if v_brand='' or v_model='' then return; end if;
  v_key := lower(v_brand)||'|'||lower(v_model);
  insert into public.drive_model_views(model_key,brand,model,image,views,updated_at)
  values(v_key,v_brand,v_model,coalesce(p_image,''),1,now())
  on conflict(model_key) do update set
    views=public.drive_model_views.views+1,
    image=case when excluded.image<>'' then excluded.image else public.drive_model_views.image end,
    updated_at=now();
end;
$$;

create or replace function public.get_popular_models(p_limit integer default 5)
returns table(model_key text,brand text,model text,image text,views bigint)
language sql
security definer
set search_path = public
stable
as $$
  select d.model_key,d.brand,d.model,d.image,d.views
  from public.drive_model_views d
  where d.views > 0
  order by d.views desc,d.updated_at desc
  limit greatest(1,least(coalesce(p_limit,5),20));
$$;

revoke all on function public.record_model_view(text,text,text) from public;
revoke all on function public.get_popular_models(integer) from public;
grant execute on function public.record_model_view(text,text,text) to anon,authenticated;
grant execute on function public.get_popular_models(integer) to anon,authenticated;
