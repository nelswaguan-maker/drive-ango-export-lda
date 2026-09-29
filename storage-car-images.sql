-- DRIVE CARS — armazenamento das fotos dos veículos
-- Execute este ficheiro UMA vez no Supabase > SQL Editor.
-- As fotos escolhidas na galeria serão guardadas no bucket "car-images".

insert into storage.buckets (id, name, public)
values ('car-images', 'car-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Car images public read" on storage.objects;
create policy "Car images public read"
on storage.objects for select
to public
using (bucket_id = 'car-images');

drop policy if exists "Admins can upload car images" on storage.objects;
create policy "Admins can upload car images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'car-images'
  and public.is_current_user_admin()
  and public.admin_has_permission('publish')
  and (split_part(name,'/',1) = auth.uid()::text or split_part(name,'/',1) = 'promotions')
);

drop policy if exists "Admins can update car images" on storage.objects;
create policy "Admins can update car images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'car-images'
  and public.is_current_user_admin()
  and public.admin_has_permission('edit')
  and (
    split_part(name,'/',1) = auth.uid()::text
    or (split_part(name,'/',1) = 'promotions' and split_part(name,'/',2) = auth.uid()::text)
    or exists (select 1 from public.drive_cars c where c.id = split_part(name,'/',2) and c.created_by = auth.uid())
  )
)
with check (bucket_id = 'car-images' and public.is_current_user_admin() and public.admin_has_permission('edit'));

drop policy if exists "Admins can delete car images" on storage.objects;
create policy "Admins can delete car images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'car-images'
  and public.is_current_user_admin()
  and public.admin_has_permission('delete')
  and (
    split_part(name,'/',1) = auth.uid()::text
    or (split_part(name,'/',1) = 'promotions' and split_part(name,'/',2) = auth.uid()::text)
    or exists (select 1 from public.drive_cars c where c.id = split_part(name,'/',2) and c.created_by = auth.uid())
  )
);
