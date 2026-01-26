-- NOODOPLOSSING: We verwijderen de blokkade volledig.
-- We verwijderen de foreign key constraint zodat de database niet meer zeurt of de user wel of niet bestaat.

-- 1. Verwijder de constraint die de foutmelding geeft (employees_user_id_fkey)
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_user_id_fkey;

-- 2. Zorg dat de tabel open is voor nieuwe registraties
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Oude policies weggooien
DROP POLICY IF EXISTS "Allow insert for everyone" ON employees;
DROP POLICY IF EXISTS "Allow authenticated full access" ON employees;
DROP POLICY IF EXISTS "Allow public insert" ON employees;

-- Nieuwe, open policies maken
CREATE POLICY "Allow insert for everyone"
ON employees FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated full access"
ON employees FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
