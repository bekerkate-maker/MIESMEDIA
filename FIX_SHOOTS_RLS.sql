-- Enable RLS for shoots table
ALTER TABLE shoots ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view shoots (needed for models/public page)
CREATE POLICY "Allow public read access"
ON shoots FOR SELECT
TO anon, authenticated
USING (true);

-- Allow authenticated users to insert, update, delete shoots
-- (Assuming only admins/employees have accounts that can access the Manage page)
CREATE POLICY "Allow authenticated full access"
ON shoots FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
