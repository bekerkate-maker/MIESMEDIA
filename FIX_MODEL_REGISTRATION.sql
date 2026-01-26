-- FIX FOUTMELDING: "new row violates row-level security policy for table models"

-- 1. Zorg ervoor dat nieuwe gebruikers hun eigen profiel kunnen aanmaken (insert)
-- We staan toe datauthenticated users (ingelogd) hun eigen id gebruiken.
create policy "Users can insert their own profile"
on models for insert
to authenticated
with check ( auth.uid() = id );

-- 2. ALS e-mailbevestiging aan staat, is de gebruiker na 'signUp' nog NIET ingelogd (anon).
-- Dan werkt bovenstaande policy niet.
-- Om dit op te lossen zonder e-mailbevestiging uit te zetten, kunnen we een Trigger gebruiken
-- die automatisch een rij aanmaakt op basis van de registratie-data.

-- Maar voor een snelle oplossing (als je e-mailbevestiging UIT hebt gezet of het niet erg vindt):
-- Kun je inserts toestaan voor iedereen (anon) zolang het ID matches (maar anon heeft geen ID...).
-- DUS de enige veilige 'client-side' fix zonder triggers is zorgen dat autoconfirm aan staat.

-- ALTERNATIEF (TRIGGER OPLOSSING - AANBEVOLEN):
-- Deze functie kopieert data van de auth user naar de models tabel.
-- Hiermee omzeil je de RLS check omdat triggers als admin draaien.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.models (
    id,
    email,
    first_name,
    last_name,
    gender,
    birthdate,
    instagram,
    phone,
    city,
    -- data uit metadata halen
    photo_url,
    extra_photos
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'gender',
    (new.raw_user_meta_data->>'birthdate')::date, -- zorg dat formaat yyyy-mm-dd is
    new.raw_user_meta_data->>'instagram',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'photo_url',
    case 
      when new.raw_user_meta_data->>'extra_photos' is not null 
      then (new.raw_user_meta_data->>'extra_photos')::text[] 
      else null 
    end
  );
  return new;
end;
$$;

-- Trigger activeren
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- EXTRA: Zorg dat models hun eigen data kunnen updaten en lezen
create policy "Users can update own profile"
on models for update
using ( auth.uid() = id );

create policy "Users can view own profile"
on models for select
using ( auth.uid() = id );
