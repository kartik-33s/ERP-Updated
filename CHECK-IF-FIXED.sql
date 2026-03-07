-- Run this to check if the migration was successful

-- Check 1: Does lecture_number column exist?
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'lectures' 
      AND column_name = 'lecture_number'
    ) 
    THEN '✅ YES - lecture_number column exists'
    ELSE '❌ NO - You need to run COPY-PASTE-THIS.sql'
  END as lecture_number_status;

-- Check 2: Does the RPC function exist?
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'create_lecture_with_attendance'
    ) 
    THEN '✅ YES - RPC function exists'
    ELSE '❌ NO - You need to run COPY-PASTE-THIS.sql'
  END as function_status;

-- Check 3: Show all columns in lectures table
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'lectures'
ORDER BY ordinal_position;

-- Final verdict
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'lectures' 
      AND column_name = 'lecture_number'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'create_lecture_with_attendance'
    )
    THEN '🎉 EVERYTHING IS READY! Try marking attendance now.'
    ELSE '⚠️ MIGRATION NOT COMPLETE! Run COPY-PASTE-THIS.sql first.'
  END as final_status;
