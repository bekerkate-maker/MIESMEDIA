-- ALLES-IN-ÉÉN HERSTEL SCRIPT (VERSIE 2)
-- Nu met alle verplichte velden om errors te voorkomen.

-- DEEL 1: RLS POLICIES HERSTELLEN (Zodat toekomstige registraties wel werken)
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert model" ON models;
DROP POLICY IF EXISTS "Authenticated can insert model" ON models;
DROP POLICY IF EXISTS "Owner can view own model" ON models;
DROP POLICY IF EXISTS "Owner can update own model" ON models;
DROP POLICY IF EXISTS "Users can insert their own profile" ON models;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON models;
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON models;

CREATE POLICY "Public can insert model"
ON models FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Owner can view own model"
ON models FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Owner can update own model"
ON models FOR UPDATE
USING (auth.uid() = id);

-- DEEL 2: HERSTEL HET PROFIEL
DO $$
DECLARE
    target_user_id uuid;
    target_email text := 'bekerkate@gmail.com';
BEGIN
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

    IF target_user_id IS NOT NULL THEN
        -- Check of deze user al in 'models' staat
        IF NOT EXISTS (SELECT 1 FROM models WHERE id = target_user_id) THEN
            
            -- NU MET ALLE VERPLICHTE VELDEN
            INSERT INTO public.models (
                id, 
                email, 
                first_name, 
                last_name, 
                gender, 
                birthdate, 
                phone, 
                city, 
                instagram
            )
            VALUES (
                target_user_id, 
                target_email, 
                'Kate', 
                'Beker', 
                'vrouw',           -- Verplicht veld
                '1997-01-01',      -- Verplicht veld (dummy datum, pas aan in profiel)
                '0612345678',      -- Verplicht veld
                'Rotterdam',       -- Verplicht veld
                '@katebeker'       -- Verplicht veld
            );
            
            RAISE NOTICE 'Model profiel voor % is succesvol aangemaakt!', target_email;
        ELSE
            RAISE NOTICE 'Model profiel voor % bestaat al.', target_email;
        END IF;

        -- Bevestig email voor de zekerheid
        UPDATE auth.users SET email_confirmed_at = now() WHERE id = target_user_id;
    ELSE
        RAISE NOTICE 'Gebruiker % niet gevonden in auth.users. Registreer eerst via de site.', target_email;
    END IF;
END $$;
