-- Step-by-step migration script
-- Run each section one at a time if you encounter errors

-- ============================================
-- STEP 1: Check existing tables
-- ============================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'lectures', 'attendance', 'od_requests');

-- ============================================
-- STEP 2: Check lectures table structure
-- ============================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'lectures'
ORDER BY ordinal_position;

-- ============================================
-- STEP 3: Add section column to lectures table
-- ============================================
-- First, check if section column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'lectures' 
          AND column_name = 'section'
    ) THEN
        ALTER TABLE public.lectures ADD COLUMN section TEXT;
        RAISE NOTICE 'Added section column to lectures table';
    ELSE
        RAISE NOTICE 'Section column already exists in lectures table';
    END IF;
END $$;

-- ============================================
-- STEP 4: Make class_id nullable (if it exists)
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'lectures' 
          AND column_name = 'class_id'
    ) THEN
        ALTER TABLE public.lectures ALTER COLUMN class_id DROP NOT NULL;
        RAISE NOTICE 'Made class_id nullable';
    ELSE
        RAISE NOTICE 'class_id column does not exist';
    END IF;
END $$;

-- ============================================
-- STEP 5: Verify the changes
-- ============================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'lectures'
ORDER BY ordinal_position;

-- ============================================
-- STEP 6: Check profiles table for section column
-- ============================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================
-- STEP 7: Add section column to profiles if missing
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'section'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN section TEXT;
        RAISE NOTICE 'Added section column to profiles table';
    ELSE
        RAISE NOTICE 'Section column already exists in profiles table';
    END IF;
END $$;

-- ============================================
-- STEP 8: Update existing student sections based on roll numbers
-- ============================================
UPDATE public.profiles
SET section = CASE
  WHEN student_id IS NOT NULL AND student_id ~ '^[0-9]+$' THEN
    CASE
      WHEN CAST(student_id AS INTEGER) >= 2320000 AND CAST(student_id AS INTEGER) <= 2320100 THEN 'A'
      WHEN CAST(student_id AS INTEGER) >= 2320101 AND CAST(student_id AS INTEGER) <= 2320200 THEN 'B'
      ELSE 'A'
    END
  ELSE section
END
WHERE role = 'student';

-- ============================================
-- STEP 9: Verify student sections
-- ============================================
SELECT 
  id,
  full_name,
  student_id,
  section,
  email,
  role
FROM public.profiles
WHERE role = 'student'
ORDER BY student_id;

-- ============================================
-- STEP 10: Check section distribution
-- ============================================
SELECT 
  section,
  COUNT(*) as student_count
FROM public.profiles
WHERE role = 'student'
GROUP BY section;
