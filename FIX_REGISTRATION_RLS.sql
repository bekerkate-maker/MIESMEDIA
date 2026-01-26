-- FIX VOOR REGISTRATIE PROBLEEM
-- De foutmelding "new row violates row-level security policy" betekent dat Supabase de INSERT blokkeert.
-- Dit komt omdat er geen regels zijn die zeggen "nieuwe gebruikers mogen hun eigen profiel aanmaken".
-- Run dit script in de Supabase SQL Editor om de juiste policies toe te voegen.

-- 1. Enable RLS (was waarschijnlijk al aan)
alter table models enable row level security;

-- 2. Policy: Sta ingelogde gebruikers toe om een rij toe te voegen als het ID overeenkomt
create policy "Enable insert for users based on user_id"
on models for insert
to authenticated
with check ( auth.uid() = id );

-- 3. Policy: Sta gebruikers toe om hun EIGEN rij te updaten
create policy "Enable update for users based on user_id"
on models for update
using ( auth.uid() = id )
with check ( auth.uid() = id );

-- 4. Policy: Sta gebruikers toe om hun EIGEN rij te lezen
create policy "Enable read for users based on user_id"
on models for select
using ( auth.uid() = id );

-- 5. (Optioneel) Bucket policies voor foto's (als die nog niet bestaan)
-- insert into storage.buckets (id, name, public) values ('model-photos', 'model-photos', true) on conflict do nothing;
-- create policy "Give users access to own folder" on storage.objects for all using ( bucket_id = 'model-photos' and auth.uid()::text = (storage.foldername(name))[1] );
