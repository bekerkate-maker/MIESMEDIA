-- Voeg motivation kolom toe aan shoot_registrations tabel
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE shoot_registrations 
ADD COLUMN IF NOT EXISTS motivation TEXT;

-- Optioneel: Voeg een comment toe voor documentatie
COMMENT ON COLUMN shoot_registrations.motivation IS 'Motivatie van het talent om mee te doen aan de shoot';
