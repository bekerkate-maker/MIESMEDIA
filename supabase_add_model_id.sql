-- Voeg model_id veld toe aan shoot_registrations tabel
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE shoot_registrations 
ADD COLUMN IF NOT EXISTS model_id UUID REFERENCES models(id);

-- Create index for faster lookups by model_id
CREATE INDEX IF NOT EXISTS idx_shoot_registrations_model_id 
ON shoot_registrations(model_id);
