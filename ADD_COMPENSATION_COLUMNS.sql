ALTER TABLE shoots 
ADD COLUMN IF NOT EXISTS compensation_type text,
ADD COLUMN IF NOT EXISTS compensation_amount numeric,
ADD COLUMN IF NOT EXISTS compensation_business_name text;

-- Optioneel: Update bestaande rijen als dat nodig is, bijvoorbeeld default 'geen'
-- UPDATE shoots SET compensation_type = 'geen' WHERE compensation_type IS NULL;
