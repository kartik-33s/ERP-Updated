-- Reload Supabase schema cache
-- Run this after making any schema changes

NOTIFY pgrst, 'reload schema';

-- Verify the section column exists
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'lectures' 
  AND column_name = 'section';

-- Also check profiles table
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'section';
