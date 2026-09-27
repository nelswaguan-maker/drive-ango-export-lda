-- DRIVE: agrupamento persistente Marca -> Modelo
alter table public.drive_cars
  add column if not exists brand_group text not null default '';

alter table public.drive_cars
  add column if not exists model_group text not null default '';

create index if not exists drive_cars_brand_group_idx on public.drive_cars (brand_group);
create index if not exists drive_cars_model_group_idx on public.drive_cars (model_group);
