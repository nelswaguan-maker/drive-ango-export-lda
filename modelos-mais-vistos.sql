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
