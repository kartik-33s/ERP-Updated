-- Complete diagnostic and fix script
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- PART 1: DIAGNOSE - See what we have
-- ============================================

-- Check if lectures table exists
SELECT 'Checking if lectures table exists...' as step;
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'lectures'
) as lectures_table_exists;

-- Show current structure of lectures table
SELECT 'Current lectures table structure:' as step;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'lectures'
ORDER BY ordinal_position;

-- Check if section column exists
SELECT 'Does section column exist?' as step;
SELECT EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name = 'lectures' 
    AND column_name = 'section'
) as section_column_exists;

-- ============================================
-- PART 2: FIX - Add section column if missing
-- ============================================

SELECT 'Adding section column if it does not exist...' as step;

-- Add section column (will fail silently if it already exists)
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE public.lectures ADD COLUMN section TEXT;
    RAISE NOTICE 'Section column added successfully';
  EXCEPTION 
    WHEN duplicate_column THEN 
      RAISE NOTICE 'Section column already exists';
  END;
END $$;

-- Make section NOT NULL after adding it (optional, for data integrity)
-- Uncomment if you want section to be required
-- UPDATE public.lectures SET section = 'A' WHERE section IS NULL;
-- ALTER TABLE public.lectures ALTER COLUMN section SET NOT NULL;

-- ============================================
-- PART 3: VERIFY - Confirm the fix
-- ============================================

SELECT 'Verifying section column was added...' as step;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'lectures'
ORDER BY ordinal_position;

-- ============================================
-- PART 4: RELOAD CACHE
-- ============================================

SELECT 'Reloading PostgREST schema cache...' as step;
NOTIFY pgrst, 'reload schema';

SELECT '✅ All done! Section column should now be available.' as result;
