-- 1. Enable RLS op de shoot_registrations tabel (voor de zekerheid)
ALTER TABLE shoot_registrations ENABLE ROW LEVEL SECURITY;

-- 2. Verwijder oude policies om conflicten te voorkomen
DROP POLICY IF EXISTS "Allow authenticated full access registrations" ON shoot_registrations;
DROP POLICY IF EXISTS "Allow public insert registrations" ON shoot_registrations;
DROP POLICY IF EXISTS "Allow public read own registrations" ON shoot_registrations;

-- 3. Maak nieuwe policies aan

-- Iedereen (ook bezoekers/talenten) mag zich aanmelden (INSERT)
CREATE POLICY "Allow public insert registrations"
ON shoot_registrations FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Alleen ingelogde gebruikers (medewerkers) mogen ALLE registraties zien, bewerken en verwijderen
-- Dit dekt SELECT, UPDATE, DELETE voor medewerkers
CREATE POLICY "Allow authenticated full access registrations"
ON shoot_registrations FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- (Optioneel) Talenten mogen hun eigen registraties zien (als ze ingelogd zijn met hun eigen ID, maar dat is hier misschien niet van toepassing als ze via email link werken, 
-- maar voor dashboard is dit handig voor models)
-- Voor nu houden we het simpel: medewerkers (authenticated) mogen alles.

-- Controleer of het gelukt is
SELECT * FROM pg_policies WHERE tablename = 'shoot_registrations';
