-- Create table for shoot registrations
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS shoot_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shoot_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  instagram TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE shoot_registrations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (public can register)
CREATE POLICY "Anyone can register for shoots"
ON shoot_registrations
FOR INSERT
TO public
WITH CHECK (true);

-- Policy: Only authenticated users (employees) can view registrations
CREATE POLICY "Authenticated users can view registrations"
ON shoot_registrations
FOR SELECT
TO authenticated
USING (true);

-- Create index for faster lookups by shoot_id
CREATE INDEX IF NOT EXISTS idx_shoot_registrations_shoot_id 
ON shoot_registrations(shoot_id);

-- Create index for faster sorting by date
CREATE INDEX IF NOT EXISTS idx_shoot_registrations_created_at 
ON shoot_registrations(created_at DESC);
