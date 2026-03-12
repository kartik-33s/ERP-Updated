-- ========================================
-- VERIFY FUNCTION EXISTS AND REFRESH CACHE
-- RUN THIS IN SUPABASE SQL EDITOR
-- ========================================

-- Step 1: Check if function exists
SELECT 
  routine_name,
  string_agg(parameter_name || ' ' || data_type, ', ' ORDER BY ordinal_position) as parameters
FROM information_schema.routines r
LEFT JOIN information_schema.parameters p 
  ON r.specific_name = p.specific_name
WHERE r.routine_schema = 'public' 
  AND r.routine_name = 'create_qr_attendance_session'
GROUP BY routine_name;

-- Step 2: If function exists, try calling it directly to test
-- (This will fail but shows if function is callable)
-- SELECT * FROM create_qr_attendance_session(
--   15, 12.9716, '2024-03-15', 1, '09:15', 77.5946, 100, 'A', 'Test', auth.uid()
-- );

-- Step 3: Check schema cache
SELECT * FROM pg_proc 
WHERE proname = 'create_qr_attendance_session';
