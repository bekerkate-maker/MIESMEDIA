-- OPLOSSING VOOR "POLICY ALREADY EXISTS" EN REGISTRATIE PROBLEMEN

-- 1. Eeerst verwijderen we de oude regels (policies) om conflicten te voorkomen
-- Dit lost de "ERROR: 42710: policy ... already exists" op.
drop policy if exists "Enable insert for users based on user_id" on models;
drop policy if exists "Enable update for users based on user_id" on models;
drop policy if exists "Enable read for users based on user_id" on models;
drop policy if exists "Users can insert their own profile" on models;
drop policy if exists "Users can update own profile" on models;
drop policy if exists "Users can view own profile" on models;

-- 2. Zorg dat beveiliging AAN staat
alter table models enable row level security;

-- 3. Maak de regels opnieuw aan
-- Regel: Je mag een profiel aanmaken (insert) als je ingelogd bent EN het ID jouw eigen ID is
create policy "Enable insert for users based on user_id"
on models for insert
to authenticated
with check ( auth.uid() = id );

-- Regel: Je mag je eigen profiel updaten
create policy "Enable update for users based on user_id"
on models for update
using ( auth.uid() = id );

-- Regel: Je mag je eigen profiel bekijken
create policy "Enable read for users based on user_id"
on models for select
using ( auth.uid() = id );

-- BELANGRIJK:
-- Als je na het uitvoeren van dit script NOG STEEDS de melding "new row violates row-level security policy" krijgt bij het registreren,
-- dan staat waarschijnlijk "Email Confirmation" AAN in Supabase.
-- Als dat aan staat, ben je na registratie nog niet direct "authenticated" (ingelogd), waardoor de insert faalt.
--
-- OPLOSSING:
-- 1. Ga naar Supabase Dashboard -> Authentication -> Providers -> Email
-- 2. Zet "Confirm email" UIT (Disable).
-- 3. Sla op.
-- 4. Probeer opnieuw te registreren.
