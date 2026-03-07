-- Diagnostic script to check current database state
-- Run this first to see what exists

-- ============================================
-- 1. Check what tables exist
-- ============================================
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================
-- 2. Check profiles table structure
-- ============================================
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================
-- 3. Check lectures table structure (if exists)
-- ============================================
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'lectures'
ORDER BY ordinal_position;

-- ============================================
-- 4. Check attendance table structure (if exists)
-- ============================================
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'attendance'
ORDER BY ordinal_position;

-- ============================================
-- 5. Check current student data
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
-- 6. Check if trigger exists
-- ============================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public' OR event_object_schema = 'auth'
ORDER BY trigger_name;
