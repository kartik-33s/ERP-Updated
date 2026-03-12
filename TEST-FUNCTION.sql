-- ========================================
-- TEST IF FUNCTION EXISTS
-- Run this in Supabase SQL Editor to check
-- ========================================

-- Check if function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'create_qr_attendance_session';

-- If the above returns 0 rows, the function doesn't exist
-- You need to run FINAL-QR-SETUP.sql

-- Check if tables exist
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('attendance_sessions', 'attendance_logs');

-- Should return 2 rows if tables exist
