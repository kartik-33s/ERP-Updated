-- Verify student IDs and profiles match

-- ============================================
-- 1. Show all students with their UUIDs
-- ============================================
SELECT 
  'All students in profiles table:' as info;

SELECT 
  id as uuid,
  student_id as roll_number,
  full_name,
  section,
  email
FROM public.profiles
WHERE role = 'student'
ORDER BY section, student_id;

-- ============================================
-- 2. Count students by section
-- ============================================
SELECT 
  'Student count by section:' as info;

SELECT 
  section,
  COUNT(*) as count
FROM public.profiles
WHERE role = 'student'
GROUP BY section;

-- ============================================
-- 3. Check if there are any NULL sections
-- ============================================
SELECT 
  'Students with NULL section:' as info;

SELECT 
  id,
  student_id,
  full_name,
  section
FROM public.profiles
WHERE role = 'student' AND section IS NULL;

-- ============================================
-- 4. Verify foreign key constraint
-- ============================================
SELECT 
  'Foreign key constraint details:' as info;

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
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'attendance'
  AND kcu.column_name = 'student_id';

-- ============================================
-- 5. Check if profiles.id is the primary key
-- ============================================
SELECT 
  'Profiles table primary key:' as info;

SELECT
  tc.constraint_name,
  kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_name = 'profiles';
