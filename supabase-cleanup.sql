-- Cleanup script to fix duplicate profile issues

-- 1. First, check for users without profiles
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name' as full_name,
  u.raw_user_meta_data->>'role' as role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 2. Create missing profiles for users that don't have them
INSERT INTO public.profiles (id, email, full_name, role, student_id, department, section)
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'role',
  u.raw_user_meta_data->>'student_id',
  u.raw_user_meta_data->>'department',
  u.raw_user_meta_data->>'section'
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 3. Optional: Delete test users if you want to start fresh
-- Uncomment the lines below to delete all users and start over
-- DELETE FROM public.profiles;
-- DELETE FROM auth.users;
