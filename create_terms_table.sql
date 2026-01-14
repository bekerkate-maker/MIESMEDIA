-- Create table for storing terms and conditions document
CREATE TABLE IF NOT EXISTS terms_and_conditions (
  id SERIAL PRIMARY KEY,
  document_url TEXT NOT NULL,
  uploaded_by TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Add RLS policies
ALTER TABLE terms_and_conditions ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read the active terms
CREATE POLICY "Anyone can view active terms"
  ON terms_and_conditions
  FOR SELECT
  USING (is_active = true);

-- Only authenticated users can insert/update
CREATE POLICY "Authenticated users can manage terms"
  ON terms_and_conditions
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_terms_active ON terms_and_conditions(is_active) WHERE is_active = true;

-- Insert a placeholder if no terms exist yet
INSERT INTO terms_and_conditions (document_url, uploaded_by, is_active)
SELECT 
  'https://placeholder-url.com/terms.pdf',
  'System',
  false
WHERE NOT EXISTS (SELECT 1 FROM terms_and_conditions);
