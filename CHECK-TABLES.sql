-- ========================================
-- CHECK IF TABLES EXIST
-- Run this to see what's in your database
-- ========================================

-- Check all tables in public schema
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check specifically for our tables
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance_sessions')
    THEN '✅ attendance_sessions EXISTS'
    ELSE '❌ attendance_sessions MISSING'
  END as sessions_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance_logs')
    THEN '✅ attendance_logs EXISTS'
    ELSE '❌ attendance_logs MISSING'
  END as logs_status;
