-- Corrige o Proprietário Principal e cria o perfil caso a conta já existisse antes do trigger.
insert into public.profiles (id, name, email, role, blocked)
select u.id,
       coalesce(u.raw_user_meta_data->>'name','Proprietário Principal'),
       u.email,
       'admin',
       false
from auth.users u
where lower(u.email)=lower('nelswaguan@gmail.com')
on conflict (id) do update set
  email=excluded.email,
  role='admin',
  blocked=false,
  updated_at=now();

-- Garante que o proprietário é reconhecido pelo RPC.
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

grant execute on function public.is_current_user_admin() to authenticated;
