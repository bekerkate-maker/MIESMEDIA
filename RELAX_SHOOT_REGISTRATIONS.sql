-- MAAK SHOOT_REGISTRATIONS MINDER STRENG
-- Verwijder NOT NULL constraints zodat aanmelden soepel verloopt

-- 1. Maak 'name' optioneel (we halen de naam uit het model profiel)
ALTER TABLE shoot_registrations ALTER COLUMN name DROP NOT NULL;

-- 2. Voeg motivation toe als die nog niet bestaat (optioneel veld)
ALTER TABLE shoot_registrations 
ADD COLUMN IF NOT EXISTS motivation TEXT;

-- 3. Zorg dat de belangrijkste velden wel verplicht blijven
-- (shoot_id, model_id, status blijven required)

-- Controleer de structuur
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'shoot_registrations'
ORDER BY ordinal_position;
