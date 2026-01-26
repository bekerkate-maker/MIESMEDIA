-- 1. Enable RLS op de shoots tabel (voor de zekerheid)
ALTER TABLE shoots ENABLE ROW LEVEL SECURITY;

-- 2. Verwijder oude policies om conflicten te voorkomen
DROP POLICY IF EXISTS "Allow public read access" ON shoots;
DROP POLICY IF EXISTS "Allow authenticated full access" ON shoots;
DROP POLICY IF EXISTS "Enable read access for all users" ON shoots;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON shoots;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON shoots;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON shoots;

-- 3. Maak nieuwe policies aan

-- Iedereen (ook bezoekers) mag shoots bekijken (SELECT)
CREATE POLICY "Allow public read access"
ON shoots FOR SELECT
TO anon, authenticated
USING (true);

-- Alleen ingelogde gebruikers (authenticated) mogen shoots aanmaken, aanpassen en verwijderen
-- Dit dekt INSERT, UPDATE, en DELETE
CREATE POLICY "Allow authenticated full access"
ON shoots FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Controleer of het gelukt is
SELECT * FROM pg_policies WHERE tablename = 'shoots';
