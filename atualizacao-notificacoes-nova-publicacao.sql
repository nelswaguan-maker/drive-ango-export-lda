-- DRIVE: notificações globais de novas publicações
-- Guarda a notificação no Supabase para que todos os dispositivos/contas
-- possam recebê-la através do realtime.
create table if not exists public.drive_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'car',
  title text not null,
  message text not null,
  car_id text,
  created_at timestamptz not null default now()
);

alter table public.drive_notifications enable row level security;

drop policy if exists "Public can read notifications" on public.drive_notifications;
create policy "Public can read notifications"
on public.drive_notifications for select
to anon, authenticated
using (true);

drop policy if exists "Admins can create notifications" on public.drive_notifications;
create policy "Admins can create notifications"
on public.drive_notifications for insert
to authenticated
with check (public.is_current_user_admin());

do $$
begin
  alter publication supabase_realtime add table public.drive_notifications;
exception when duplicate_object then null;
end $$;
