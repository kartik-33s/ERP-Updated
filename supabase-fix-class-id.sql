-- Fix the class_id issue in lectures table
-- We're using 'section' instead of 'class_id'

-- ============================================
-- OPTION 1: Make class_id nullable (Recommended)
-- ============================================
-- This keeps the column but makes it optional

ALTER TABLE public.lectures 
ALTER COLUMN class_id DROP NOT NULL;

-- ============================================
-- OPTION 2: Remove class_id entirely (Alternative)
-- ============================================
-- Uncomment the line below if you want to remove class_id completely
-- ALTER TABLE public.lectures DROP COLUMN class_id;

-- ============================================
-- Verify the change
-- ============================================
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'lectures'
ORDER BY ordinal_position;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

SELECT '✅ class_id is now nullable. You can save attendance!' as result;
