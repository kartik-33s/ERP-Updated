-- Simple check to see if you have students in the database

-- 1. Count total students
SELECT COUNT(*) as total_students
FROM public.profiles
WHERE role = 'student';

-- 2. List all students
SELECT 
  id,
  student_id as roll_number,
  full_name,
  email,
  section,
  role
FROM public.profiles
WHERE role = 'student'
ORDER BY section, student_id;

-- 3. Count by section
SELECT 
  section,
  COUNT(*) as count
FROM public.profiles
WHERE role = 'student'
GROUP BY section;

-- 4. Check if the RPC function has been updated
SELECT 
  routine_name,
  specific_name,
  created as created_at
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'create_lecture_with_attendance';
