-- Debug script to find why attendance is failing

-- ============================================
-- 1. Check foreign key constraints on attendance table
-- ============================================
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

-- ============================================
-- 2. Check what's in the profiles table
-- ============================================
SELECT 
  'Profiles table - Student IDs:' as info;
  
SELECT 
  id,
  full_name,
  student_id,
  section,
  email
FROM public.profiles
WHERE role = 'student'
ORDER BY section, student_id;

-- ============================================
-- 3. Check if the foreign key references the right column
-- ============================================
-- The attendance.student_id should reference profiles.id (UUID)
-- NOT profiles.student_id (roll number)

SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'attendance'
  AND column_name IN ('student_id', 'lecture_id', 'marked_by');

SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('id', 'student_id');

-- ============================================
-- 4. Test if we can manually insert attendance
-- ============================================
-- First, let's see if we have any students
DO $$
DECLARE
  v_student_id UUID;
  v_teacher_id UUID;
  v_lecture_id UUID;
BEGIN
  -- Get a student ID
  SELECT id INTO v_student_id 
  FROM public.profiles 
  WHERE role = 'student' 
  LIMIT 1;
  
  -- Get a teacher ID
  SELECT id INTO v_teacher_id 
  FROM public.profiles 
  WHERE role = 'teacher' 
  LIMIT 1;
  
  IF v_student_id IS NULL THEN
    RAISE NOTICE 'No students found in profiles table!';
  ELSE
    RAISE NOTICE 'Found student with ID: %', v_student_id;
  END IF;
  
  IF v_teacher_id IS NULL THEN
    RAISE NOTICE 'No teachers found in profiles table!';
  ELSE
    RAISE NOTICE 'Found teacher with ID: %', v_teacher_id;
  END IF;
END $$;

-- ============================================
-- 5. Check recent lectures
-- ============================================
SELECT 
  id,
  subject,
  section,
  lecture_date,
  created_at
FROM public.lectures
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 6. Check if there are orphaned attendance records
-- ============================================
SELECT 
  a.id,
  a.student_id,
  a.lecture_id,
  CASE WHEN p.id IS NULL THEN 'STUDENT NOT FOUND' ELSE 'OK' END as student_status,
  CASE WHEN l.id IS NULL THEN 'LECTURE NOT FOUND' ELSE 'OK' END as lecture_status
FROM public.attendance a
LEFT JOIN public.profiles p ON a.student_id = p.id
LEFT JOIN public.lectures l ON a.lecture_id = l.id
LIMIT 10;
