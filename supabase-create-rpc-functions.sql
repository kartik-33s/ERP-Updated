-- Create RPC functions to bypass schema cache issues
-- These functions will work even if the schema cache is stale

-- ============================================
-- Function to create lecture with attendance
-- ============================================
CREATE OR REPLACE FUNCTION create_lecture_with_attendance(
  p_subject TEXT,
  p_teacher_id UUID,
  p_section TEXT,
  p_lecture_date DATE,
  p_lecture_time TIME,
  p_attendance_records JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lecture_id UUID;
  v_record JSONB;
BEGIN
  -- Insert lecture
  INSERT INTO public.lectures (subject, teacher_id, section, lecture_date, lecture_time)
  VALUES (p_subject, p_teacher_id, p_section, p_lecture_date, p_lecture_time)
  RETURNING id INTO v_lecture_id;

  -- Insert attendance records
  FOR v_record IN SELECT * FROM jsonb_array_elements(p_attendance_records)
  LOOP
    INSERT INTO public.attendance (student_id, lecture_id, date, status, marked_by)
    VALUES (
      (v_record->>'student_id')::UUID,
      v_lecture_id,
      (v_record->>'date')::DATE,
      v_record->>'status',
      (v_record->>'marked_by')::UUID
    );
  END LOOP;

  RETURN v_lecture_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_lecture_with_attendance TO authenticated;

-- ============================================
-- Test the function (optional)
-- ============================================
-- SELECT create_lecture_with_attendance(
--   'Test Subject',
--   'your-teacher-uuid-here'::UUID,
--   'A',
--   '2024-01-15'::DATE,
--   '09:00'::TIME,
--   '[{"student_id": "student-uuid", "date": "2024-01-15", "status": "present", "marked_by": "teacher-uuid"}]'::JSONB
-- );

-- ============================================
-- Verify the function was created
-- ============================================
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'create_lecture_with_attendance';
