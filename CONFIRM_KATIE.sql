-- DIT SCRIPT BEVESTIGT JOUW SPECIFIEKE ACCOUNT
-- Zodat je direct kunt inloggen zonder verificatie-email.

-- 1. Bevestig het specifieke emailadres
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'bekerkate@gmail.com';

-- 2. Zorg dat de trigger AAN staat voor de TOEKOMSTIGE registraties
-- Dit herhaalt de instelling van het vorige script, voor de zekerheid.
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email_confirmed_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger opnieuw koppelen (DROP IF EXISTS voorkomt foutmeldingen als hij al bestond)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user();
