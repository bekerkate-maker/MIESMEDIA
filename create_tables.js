import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://etlxgjylypmpywxvglkx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0bHhnanlseXBtcHl3eHZnbGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDgwMjIsImV4cCI6MjA4MDEyNDAyMn0.w_DmbORU9M4W2LGRjt_CNaDlgI_kU5aJ9d7UNPb9egQ'
);

console.log('Creating model_notes table...');

// We kunnen geen DDL uitvoeren via de client API
// De SQL moet uitgevoerd worden in de Supabase SQL editor
console.log('\n⚠️  Je moet de SQL handmatig uitvoeren in Supabase:');
console.log('\n1. Ga naar: https://supabase.com/dashboard/project/etlxgjylypmpywxvglkx/sql');
console.log('2. Plak de SQL uit het bestand: supabase_notes_and_photos.sql');
console.log('3. Klik op "Run"');
console.log('\nOf kopieer deze SQL:\n');

const sql = `
-- Tabel voor model notities
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

-- RLS uitschakelen voor development
ALTER TABLE model_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE model_photos DISABLE ROW LEVEL SECURITY;
`;

console.log(sql);
