-- Add end_time column to shoots table if it doesn't exist
-- This allows storing the end time for each shoot

-- Check if column exists and add it if not
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'shoots' 
        AND column_name = 'end_time'
    ) THEN
        ALTER TABLE shoots ADD COLUMN end_time TIME;
        COMMENT ON COLUMN shoots.end_time IS 'End time of the shoot';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'shoots'
ORDER BY ordinal_position;
