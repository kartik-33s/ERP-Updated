-- ========================================
-- DIAGNOSTIC: Run this in Supabase SQL Editor to find the foreign key issue
-- ========================================

-- 1. What does the attendance foreign key actually reference?
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'attendance' 
  AND tc.constraint_type = 'FOREIGN KEY';

-- 2. Show attendance table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'attendance'
ORDER BY ordinal_position;

-- 3. Check if a separate 'students' table exists  
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('students', 'profiles');

-- 4. Count profiles by role
SELECT role, count(*) FROM public.profiles GROUP BY role;

-- 5. Show some student profiles
SELECT id, email, full_name, student_id, section, role 
FROM public.profiles 
WHERE role = 'student' 
LIMIT 10;
