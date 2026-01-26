-- DIT SCRIPT LOST DE "FOREIGN KEY" EN "RLS" PROBLEMEN OP VOOR REGISTRATIE

-- 1. SCHOONMAAK: Verwijder 'zwevende' employees die geen gekoppelde user meer hebben.
-- Dit voorkomt errors bij het aanmaken van de nieuwe koppeling.
DELETE FROM employees WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 2. KOPPELING HERSTELLEN: Zorg dat employees correct naar de auth.users tabel verwijzen
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_user_id_fkey;

ALTER TABLE employees
ADD CONSTRAINT employees_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users (id)
ON DELETE CASCADE;

-- 3. PERMISSIES HERSTELLEN (RLS): Zorg dat nieuwe gebruikers mogen registreren
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Verwijder oude, mogelijk conflicterende regels
DROP POLICY IF EXISTS "Allow authenticated read access" ON employees;
DROP POLICY IF EXISTS "Allow insert for everyone" ON employees;
DROP POLICY IF EXISTS "Enable read access for all users" ON employees;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON employees;
DROP POLICY IF EXISTS "Allow public insert" ON employees;
DROP POLICY IF EXISTS "Allow authenticated full access" ON employees;

-- NIEUWE REGELS:
-- A. Iedereen (ook bezoekers tijdens registratie) mag een employee profiel aanmaken
CREATE POLICY "Allow public insert"
ON employees FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- B. Ingelogde gebruikers (medewerkers) hebben volledige toegang tot de employees tabel
CREATE POLICY "Allow authenticated full access"
ON employees FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Controleer of alles goed staat
SELECT * FROM pg_policies WHERE tablename = 'employees';
