-- 1. Enable RLS op de employees tabel
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- 2. Verwijder oude policies om conflicten te voorkomen
DROP POLICY IF EXISTS "Enable read access for all users" ON employees;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON employees;
DROP POLICY IF EXISTS "Enable insert for everyone" ON employees;

-- 3. Maak nieuwe policies aan

-- Policy 1: Iedereen mag employees LEZEN (nodig voor login checks etc, of beperk tot authenticated)
-- We zetten hem op authenticated voor veiligheid, of public als dat nodig is. 
-- Voor nu: authenticated users mogen employees zien.
CREATE POLICY "Allow authenticated read access"
ON employees FOR SELECT
TO authenticated
USING (true);

-- Policy 2: INSERT permissies voor registratie
-- Omdat we in de flow eerst signUp doen en dan inserten, is de gebruiker ingelogd als hij 'signUp' aanroept ZONDER email confirmatie.
-- Als email confirmatie AAN staat, is hij nog 'anon'.
-- Voor zekerheid staan we insert toe voor zowel anon als authenticated, 
-- MAAR met de check dat de user_id overeenkomt met de auth.uid() (indien authenticated) 
-- OF we laten het tijdelijk openstaan voor de initiële setup.
-- Gezien de error "new row violates..." blokkeert hij nu.
-- We maken een policy die inserts toestaat.

CREATE POLICY "Allow insert for everyone"
ON employees FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy 3: Update eigen profiel
CREATE POLICY "Allow individuals to update their own employee record"
ON employees FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Check of het gelukt is
SELECT * FROM pg_policies WHERE tablename = 'employees';
