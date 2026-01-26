-- ALLERLAATSTE POGING: SCHONE LEI
-- We verwijderen EERST alles, en zetten dan de deur open voor registratie.

-- 1. Verwijder ALLE mogelijke policies die we ooit hebben gemaakt
-- Het maakt niet uit of ze wel of niet bestaan, we proberen ze allemaal weg te gooien.
drop policy if exists "Enable insert for users based on user_id" on models;
drop policy if exists "Enable update for users based on user_id" on models;
drop policy if exists "Enable read for users based on user_id" on models;
drop policy if exists "Allow anonymous registration" on models;
drop policy if exists "Users can insert their own profile" on models;
drop policy if exists "Users can update own profile" on models;
drop policy if exists "Users can view own profile" on models;

-- 2. Maak de "Alles mag bij registratie" regel aan
-- Dit zorgt dat de registratie ALTIJD lukt, ook zonder login
create policy "Allow anonymous registration"
on models for insert
to anon, authenticated
with check ( true );

-- 3. Maak de update regel aan (alleen eigen profiel)
create policy "Enable update for users based on user_id"
on models for update
using ( auth.uid() = id );

-- 4. Maak de lees regel aan (alleen eigen profiel)
create policy "Enable read for users based on user_id"
on models for select
using ( auth.uid() = id );
