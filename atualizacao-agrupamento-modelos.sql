-- DRIVE: campos persistentes para agrupamento de marca/modelo
alter table public.drive_cars add column if not exists brand_group text not null default '';
alter table public.drive_cars add column if not exists model_group text not null default '';

-- Depois de executar este SQL, use no painel Admin: "Agrupar agora".
