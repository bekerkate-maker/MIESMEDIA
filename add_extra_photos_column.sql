-- Add extra_photos column to models table
-- This column stores an array of URLs to additional photos for each model
ALTER TABLE models ADD COLUMN IF NOT EXISTS extra_photos text[] DEFAULT NULL;
