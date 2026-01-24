-- Voeg kolom toe voor de naam van de zaak bij een cadeaubon
ALTER TABLE public.shoots 
ADD COLUMN IF NOT EXISTS compensation_business_name text,
ADD COLUMN IF NOT EXISTS compensation_amount numeric;
