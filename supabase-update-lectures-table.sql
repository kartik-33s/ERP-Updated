-- Update lectures table to use section instead of class_id

-- Check if lectures table exists and its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'lectures';

-- Add section column if it doesn't exist
ALTER TABLE public.lectures 
ADD COLUMN IF NOT EXISTS section TEXT;

-- Make class_id nullable (if it exists and is required)
ALTER TABLE public.lectures 
ALTER COLUMN class_id DROP NOT NULL;

-- Or if you want to completely remove class_id and use section instead:
-- ALTER TABLE public.lectures DROP COLUMN IF EXISTS class_id;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'lectures';

-- Check existing data
SELECT * FROM public.lectures LIMIT 5;
