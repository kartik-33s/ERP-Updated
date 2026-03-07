-- Simple script to add section column to lectures table
-- Run this in Supabase SQL Editor

-- First, check what columns currently exist
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'lectures'
ORDER BY ordinal_position;

-- Add the section column
ALTER TABLE public.lectures 
ADD COLUMN section TEXT;

-- Verify it was added
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'lectures'
ORDER BY ordinal_position;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

-- Show success message
SELECT 'Section column added successfully!' as message;
