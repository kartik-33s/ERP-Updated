-- Test the RPC function with actual data from your database

-- ============================================
-- 1. Get a real student ID and teacher ID
-- ============================================
SELECT 'Student IDs:' as info;
SELECT id, full_name, student_id, section 
FROM public.profiles 
WHERE role = 'student' 
ORDER BY student_id 
LIMIT 5;

SELECT 'Teacher IDs:' as info;
SELECT id, full_name, email 
FROM public.profiles 
WHERE role = 'teacher' 
LIMIT 5;

-- ============================================
-- 2. Test the RPC function with real IDs
-- ============================================
-- Replace the UUIDs below with actual IDs from the queries above

-- Example test (you need to replace these UUIDs with real ones):
/*
SELECT create_lecture_with_attendance(
  'Test Subject'::TEXT,
  'YOUR-TEACHER-UUID-HERE'::UUID,
  'A'::TEXT,
  CURRENT_DATE,
  '09:00'::TIME,
  '[
    {
      "student_id": "YOUR-STUDENT-UUID-HERE",
      "date": "2024-01-15",
      "status": "present",
      "marked_by": "YOUR-TEACHER-UUID-HERE"
    }
  ]'::JSONB
);
*/

-- ============================================
-- 3. Check if the issue is with the JSONB parsing
-- ============================================
-- Let's test if the JSONB is being parsed correctly
SELECT 
  v_record->>'student_id' as student_id_text,
  (v_record->>'student_id')::UUID as student_id_uuid
FROM jsonb_array_elements('[
  {
    "student_id": "123e4567-e89b-12d3-a456-426614174000",
    "date": "2024-01-15",
    "status": "present",
    "marked_by": "123e4567-e89b-12d3-a456-426614174001"
  }
]'::JSONB) as v_record;
