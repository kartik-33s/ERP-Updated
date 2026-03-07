-- COMPLETE CHECK - Run this to see everything at once

-- 1. Do you have students?
SELECT '=== STUDENTS CHECK ===' as info;
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'NO STUDENTS FOUND - CREATE STUDENTS FIRST!'
    ELSE 'Students found: ' || COUNT(*)::TEXT
  END as status
FROM public.profiles
WHERE role = 'student';

-- 2. List all students
SELECT '=== ALL STUDENTS ===' as info;
SELECT 
  id,
  student_id,
  full_name,
  section,
  email
FROM public.profiles
WHERE role = 'student'
ORDER BY section, student_id;

-- 3. Check RPC function
SELECT '=== RPC FUNCTION CHECK ===' as info;
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'FUNCTION NOT FOUND - RUN EMERGENCY FIX!'
    ELSE 'Function exists'
  END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'create_lecture_with_attendance';

-- 4. Check if there are any lectures already
SELECT '=== EXISTING LECTURES ===' as info;
SELECT 
  COUNT(*) as total_lectures,
  COUNT(DISTINCT lecture_date) as unique_dates
FROM public.lectures;

-- 5. Check if there's any attendance data
SELECT '=== EXISTING ATTENDANCE ===' as info;
SELECT 
  COUNT(*) as total_attendance_records
FROM public.attendance;

-- 6. Final recommendation
SELECT '=== RECOMMENDATION ===' as info;
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM public.profiles WHERE role = 'student') = 0 
    THEN '❌ CREATE STUDENTS FIRST! Go to /auth/sign-up and create student accounts.'
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'create_lecture_with_attendance')
    THEN '❌ RUN supabase-emergency-fix.sql to create the RPC function!'
    ELSE '✅ Everything looks good! Try marking attendance again.'
  END as action_needed;
