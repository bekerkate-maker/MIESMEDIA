-- Tabel voor model notities (voor werknemers)
CREATE TABLE IF NOT EXISTS model_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  employee_name TEXT NOT NULL,
  note_text TEXT NOT NULL,
  shoot_name TEXT,
  compensation_type TEXT,
  compensation_amount NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel voor meerdere foto's per model
CREATE TABLE IF NOT EXISTS model_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  upload_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes voor betere performance
CREATE INDEX IF NOT EXISTS idx_model_notes_model_id ON model_notes(model_id);
CREATE INDEX IF NOT EXISTS idx_model_notes_created_at ON model_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_model_photos_model_id ON model_photos(model_id);
CREATE INDEX IF NOT EXISTS idx_model_photos_primary ON model_photos(model_id, is_primary);

-- RLS uitschakelen voor development (pas later aan voor productie)
ALTER TABLE model_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE model_photos DISABLE ROW LEVEL SECURITY;

-- Opmerking: Voer dit script uit in je Supabase SQL editor
