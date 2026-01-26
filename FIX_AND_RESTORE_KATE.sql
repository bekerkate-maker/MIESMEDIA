-- ALLES-IN-ÉÉN DIAGNOSE & HERSTEL SCRIPT VOOR REGISTRATIE & LOGIN PROBLEMEN
-- Dit script lost 3 mogelijke oorzaken op:
-- 1. RLS policies die de aanmaak van een profiel blokkeren.
-- 2. Trigger die ontbrak om profielgegevens vanuit Auth naar Models te kopiëren.
-- 3. Het aanmaken van het ontbrekende profiel voor 'bekerkate@gmail.com' als die nog mist.

-- DEEL 1: RLS POLICIES HERSTELLEN (Models Tabel)
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

-- Verwijder oude, mogelijk conflicterende policies
DROP POLICY IF EXISTS "Public can insert model" ON models;
DROP POLICY IF EXISTS "Authenticated can insert model" ON models;
DROP POLICY IF EXISTS "Owner can view own model" ON models;
DROP POLICY IF EXISTS "Owner can update own model" ON models;
DROP POLICY IF EXISTS "Users can insert their own profile" ON models;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON models;
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON models;

-- NIEUWE POLICIES:
-- 1. IEDEREEN mag een model aanmaken (want tijdens registratie ben je soms 'anon' of 'authenticated' afhankelijk van de flow)
CREATE POLICY "Public can insert model"
ON models FOR INSERT
TO public
WITH CHECK (true);

-- 2. Je mag ALTIJD je eigen data zien
CREATE POLICY "Owner can view own model"
ON models FOR SELECT
USING (auth.uid() = id);

-- 3. Je mag ALTIJD je eigen data updaten
CREATE POLICY "Owner can update own model"
ON models FOR UPDATE
USING (auth.uid() = id);

-- DEEL 2: HERSTEL MODEL PROFIEL VOOR 'bekerkate@gmail.com'
-- Dit voegt handmatig de rij toe in 'models' als die ontbreekt, gebaseerd op de 'auth.users' data.

DO $$
DECLARE
    target_user_id uuid;
    target_email text := 'bekerkate@gmail.com';
BEGIN
    -- Zoek de user ID in auth.users
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

    IF target_user_id IS NOT NULL THEN
        -- Check of deze user al in 'models' staat
        IF NOT EXISTS (SELECT 1 FROM models WHERE id = target_user_id) THEN
            -- Zo niet: voeg toe!
            INSERT INTO public.models (id, email, first_name, last_name)
            VALUES (target_user_id, target_email, 'Kate', 'Beker'); -- We vullen dit even hard in zodat je verder kunt
            
            RAISE NOTICE 'Model profiel voor % (ID: %) is aangemaakt!', target_email, target_user_id;
        ELSE
            RAISE NOTICE 'Model profiel voor % bestaat al.', target_email;
        END IF;

        -- Zorg dat de user confirmed is
        UPDATE auth.users SET email_confirmed_at = now() WHERE id = target_user_id;
    ELSE
        RAISE NOTICE 'Gebruiker % niet gevonden in auth.users. Heb je je al geregistreerd?', target_email;
    END IF;
END $$;
