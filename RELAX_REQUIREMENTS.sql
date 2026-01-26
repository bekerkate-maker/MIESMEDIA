-- MAAK DE REGISTRATIE SOEPEL EN SIMPEL
-- We verwijderen de verplichting (NOT NULL) van de strenge velden.
-- Hierdoor kun je een account aanmaken (of herstellen) zonder dat alles direct perfect ingevuld hoeft te zijn.

-- 1. Verplichtingen verwijderen
ALTER TABLE models ALTER COLUMN gender DROP NOT NULL;
ALTER TABLE models ALTER COLUMN birthdate DROP NOT NULL;
ALTER TABLE models ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE models ALTER COLUMN city DROP NOT NULL;
ALTER TABLE models ALTER COLUMN instagram DROP NOT NULL;

-- 2. Zorg dat de beveiliging ook soepel blijft (voor de zekerheid nogmaals)
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert model" ON models;
CREATE POLICY "Public can insert model"
ON models FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Owner can update own model" ON models;
CREATE POLICY "Owner can update own model"
ON models FOR UPDATE
USING (auth.uid() = id);

-- 3. Nogmaals jouw profiel proberen te fixen (nu zonder die strenge eisen)
DO $$
DECLARE
    target_user_id uuid;
    target_email text := 'bekerkate@gmail.com';
BEGIN
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

    IF target_user_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM models WHERE id = target_user_id) THEN
            -- Nu hoeven we alleen de basics in te vullen!
            INSERT INTO public.models (id, email, first_name, last_name)
            VALUES (target_user_id, target_email, 'Kate', 'Beker');
            
            RAISE NOTICE 'Model profiel voor % is aangemaakt (simple mode)', target_email;
        END IF;
        
        -- Bevestig email
        UPDATE auth.users SET email_confirmed_at = now() WHERE id = target_user_id;
    END IF;
END $$;
