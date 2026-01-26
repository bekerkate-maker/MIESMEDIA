-- SCRIPT: RESET EMPLOYEE ACCOUNTS & SKIP EMAIL VERIFICATION
-- Dit script doet twee dingen:
-- 1. Het verwijdert alle accounts die GEEN model zijn (dus employees, admins, en mislukte registraties).
-- 2. Het zorgt ervoor dat nieuwe registraties direct goedgekeurd zijn (geen verificatie-link nodig).

-- DEEL 1: Auto-Confirm Trigger instellen
-- Zorgt dat email_confirmed_at direct wordt ingevuld bij nieuwe users
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email_confirmed_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger opnieuw aanmaken
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user();


-- DEEL 2: Verwijder accounts die geen Model zijn
-- We verwijderen users uit auth.users. Dankzij 'CASCADE' settings (als die er zijn) 
-- worden de rijen in de 'employees' tabel ook verwijderd.
-- We behouden de modellen (users die in de 'models' tabel staan).

DELETE FROM auth.users 
WHERE id NOT IN (SELECT id FROM models);

-- Als je ECHT IEDEREEN wilt verwijderen (ook modellen), uncomment dan de volgende regel:
-- DELETE FROM auth.users;

