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
SET search_path = public
AS $$
DECLARE
  v_lecture_id UUID;
  v_record JSONB;
  v_has_class_id BOOLEAN;
  v_student_id UUID;
  v_student_count INTEGER;
  v_profile_count INTEGER;
BEGIN
  -- Log input parameters
  RAISE NOTICE 'Starting create_lecture_with_attendance';
  RAISE NOTICE 'Subject: %, Teacher: %, Section: %', p_subject, p_teacher_id, p_section;
  RAISE NOTICE 'Number of attendance records: %', jsonb_array_length(p_attendance_records);
  
  -- Check total profiles (bypass RLS)
  SELECT COUNT(*) INTO v_profile_count FROM public.profiles WHERE role = 'student';
  RAISE NOTICE 'Total student profiles in database: %', v_profile_count;

  -- Check if class_id column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'lectures' 
      AND column_name = 'class_id'
  ) INTO v_has_class_id;

  -- Insert lecture (with or without class_id depending on table structure)
  IF v_has_class_id THEN
    INSERT INTO public.lectures (subject, teacher_id, section, lecture_date, lecture_time, class_id)
    VALUES (p_subject, p_teacher_id, p_section, p_lecture_date, p_lecture_time, NULL)
    RETURNING id INTO v_lecture_id;
  ELSE
    INSERT INTO public.lectures (subject, teacher_id, section, lecture_date, lecture_time)
    VALUES (p_subject, p_teacher_id, p_section, p_lecture_date, p_lecture_time)
    RETURNING id INTO v_lecture_id;
  END IF;

  RAISE NOTICE 'Created lecture with ID: %', v_lecture_id;

  -- Insert attendance records
  FOR v_record IN SELECT * FROM jsonb_array_elements(p_attendance_records)
  LOOP
    v_student_id := (v_record->>'student_id')::UUID;
    
    RAISE NOTICE 'Processing student ID: %', v_student_id;
    
    -- Check if student exists (bypass RLS by using direct query)
    SELECT COUNT(*) INTO v_student_count 
    FROM public.profiles 
    WHERE id = v_student_id AND role = 'student';
    
    IF v_student_count = 0 THEN
      RAISE EXCEPTION 'Student with ID % does not exist in profiles table. Please check the student ID.', v_student_id;
    END IF;
    
    RAISE NOTICE 'Student exists, inserting attendance record';
    
    -- Insert attendance
    INSERT INTO public.attendance (student_id, lecture_id, date, status, marked_by)
    VALUES (
      v_student_id,
      v_lecture_id,
      (v_record->>'date')::DATE,
      v_record->>'status',
      (v_record->>'marked_by')::UUID
    );
    
    RAISE NOTICE 'Attendance record inserted successfully';
  END LOOP;

  RAISE NOTICE 'Successfully created lecture and % attendance records', jsonb_array_length(p_attendance_records);
  
  RETURN v_lecture_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error in create_lecture_with_attendance: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
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
