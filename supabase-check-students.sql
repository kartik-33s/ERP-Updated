-- Check if students exist in the profiles table

-- ============================================
-- 1. Check all students in profiles table
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
-- 2. Check section distribution
-- ============================================
SELECT 
  section,
  COUNT(*) as student_count
FROM public.profiles
WHERE role = 'student'
GROUP BY section;

-- ============================================
-- 3. Check if there are any users without profiles
-- ============================================
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data->>'full_name' as full_name,
  u.raw_user_meta_data->>'role' as role,
  u.raw_user_meta_data->>'student_id' as student_id,
  CASE WHEN p.id IS NULL THEN 'NO PROFILE' ELSE 'HAS PROFILE' END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- ============================================
-- 4. Create missing profiles for users without them
-- ============================================
INSERT INTO public.profiles (id, email, full_name, role, student_id, department, section)
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'role',
  u.raw_user_meta_data->>'student_id',
  u.raw_user_meta_data->>'department',
  CASE 
    WHEN u.raw_user_meta_data->>'role' = 'student' 
      AND u.raw_user_meta_data->>'student_id' IS NOT NULL 
      AND u.raw_user_meta_data->>'student_id' ~ '^[0-9]+$' THEN
      CASE
        WHEN CAST(u.raw_user_meta_data->>'student_id' AS INTEGER) >= 2320000 
          AND CAST(u.raw_user_meta_data->>'student_id' AS INTEGER) <= 2320100 THEN 'A'
        WHEN CAST(u.raw_user_meta_data->>'student_id' AS INTEGER) >= 2320101 
          AND CAST(u.raw_user_meta_data->>'student_id' AS INTEGER) <= 2320200 THEN 'B'
        ELSE 'A'
      END
    ELSE u.raw_user_meta_data->>'section'
  END
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. Verify all students now have profiles
-- ============================================
SELECT 
  'Total users in auth.users:' as metric,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
  'Total profiles:' as metric,
  COUNT(*) as count
FROM public.profiles
UNION ALL
SELECT 
  'Student profiles:' as metric,
  COUNT(*) as count
FROM public.profiles
WHERE role = 'student';

-- ============================================
-- 6. Show students by section
-- ============================================
SELECT 
  'Section A students:' as info,
  COUNT(*) as count
FROM public.profiles
WHERE role = 'student' AND section = 'A'
UNION ALL
SELECT 
  'Section B students:' as info,
  COUNT(*) as count
FROM public.profiles
WHERE role = 'student' AND section = 'B';
