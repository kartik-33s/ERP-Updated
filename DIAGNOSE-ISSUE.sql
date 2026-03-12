-- ========================================
-- DIAGNOSTIC SCRIPT
-- Run this to identify the exact problem
-- ========================================

-- 1. Check if tables exist in database
SELECT 
  '1. TABLE CHECK' as test,
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ Both tables exist'
    WHEN COUNT(*) = 1 THEN '⚠️ Only one table exists'
    ELSE '❌ No tables found - Run CREATE-TABLES-SIMPLE.sql'
  END as result
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('attendance_sessions', 'attendance_logs');

-- 2. List all tables in public schema
SELECT 
  '2. ALL TABLES' as test,
  string_agg(tablename, ', ' ORDER BY tablename) as result
FROM pg_tables 
WHERE schemaname = 'public';

-- 3. Check attendance_sessions structure
SELECT 
  '3. SESSIONS TABLE' as test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance_sessions')
    THEN (SELECT COUNT(*)::text || ' columns' FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'attendance_sessions')
    ELSE '❌ Table does not exist'
  END as result;

-- 4. Check attendance_logs structure
SELECT 
  '4. LOGS TABLE' as test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance_logs')
    THEN (SELECT COUNT(*)::text || ' columns' FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'attendance_logs')
    ELSE '❌ Table does not exist'
  END as result;

-- 5. Check RLS policies
SELECT 
  '5. RLS POLICIES' as test,
  COUNT(*)::text || ' policies found' as result
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('attendance_sessions', 'attendance_logs');

-- 6. Check indexes
SELECT 
  '6. INDEXES' as test,
  COUNT(*)::text || ' indexes found' as result
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('attendance_sessions', 'attendance_logs');

-- 7. Test insert permission (will fail but shows if table is accessible)
SELECT 
  '7. TABLE ACCESS' as test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance_sessions')
    THEN '✅ attendance_sessions is accessible'
    ELSE '❌ attendance_sessions not accessible'
  END as result;

-- Summary
SELECT 
  '========================================' as summary,
  'DIAGNOSTIC COMPLETE' as status;

SELECT 
  'If all checks pass but still getting cache error:' as next_step,
  'Go to Dashboard → Settings → API → Restart PostgREST' as action;
