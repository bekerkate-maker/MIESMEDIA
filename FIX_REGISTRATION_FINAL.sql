-- LAATSTE REDMIDDEL: FORCEER REGISTRATIE
-- Dit script zet de deuren iets verder open zodat de registratie ALTIJD werkt,
-- ook als de gebruiker nog niet is ingelogd (bv. door e-mailbevestiging).

-- 1. Reset policies
drop policy if exists "Enable insert for users based on user_id" on models;
drop policy if exists "Allow anonymous registration" on models;

-- 2. Maak RLS aan (als niet aan)
alter table models enable row level security;

-- 3. DE BELANGRIJKSTE FIX:
-- Sta IEDEREEN (ook gasten/niet-ingelogd) toe om een regel toe te voegen.
-- Dit is nodig omdat tijdens registratie de gebruiker soms nog niet als 'authenticated' wordt gezien.
create policy "Allow anonymous registration"
on models for insert
to anon, authenticated
with check ( true );

-- 4. Zorg dat je wel alleen je eigen data mag aanpassen
create policy "Enable update for users based on user_id"
on models for update
using ( auth.uid() = id );

create policy "Enable read for users based on user_id"
on models for select
using ( auth.uid() = id );
