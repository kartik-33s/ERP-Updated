-- Diagnostic script to identify attendance foreign key issues

-- 1. Check if profiles table has students
SELECT 
  'Total Students' as check_type,
  COUNT(*) as count,
  string_agg(DISTINCT section, ', ') as sections
FROM public.profiles
WHERE role = 'student';

-- 2. Check students by section
SELECT 
  section,
  COUNT(*) as student_count,
  string_agg(student_id, ', ' ORDER BY student_id) as student_ids
FROM public.profiles
WHERE role = 'student'
GROUP BY section
ORDER BY section;

-- 3. Check if there are any orphaned attendance records
SELECT 
  'Orphaned Attendance Records' as issue,
  COUNT(*) as count
FROM public.attendance a
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.id = a.student_id
);

-- 4. Check attendance table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'attendance'
ORDER BY ordinal_position;

-- 5. Check foreign key constraints on attendance table
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'attendance';

-- 6. Check lectures table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'lectures'
ORDER BY ordinal_position;

-- 7. Sample student data
SELECT 
  id,
  student_id,
  full_name,
  section,
  role,
  created_at
FROM public.profiles
WHERE role = 'student'
ORDER BY section, student_id
LIMIT 10;

-- 8. Check if RPC function exists
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'create_lecture_with_attendance';
