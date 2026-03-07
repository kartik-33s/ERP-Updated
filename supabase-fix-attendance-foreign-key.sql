-- Fix the RPC function to handle foreign key constraint properly
-- This adds validation to ensure student IDs exist before inserting attendance

CREATE OR REPLACE FUNCTION public.create_lecture_with_attendance(
  p_subject TEXT,
  p_teacher_id UUID,
  p_section TEXT,
  p_lecture_date DATE,
  p_lecture_time TIME,
  p_lecture_number INTEGER,
  p_attendance_records JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lecture_id UUID;
  v_record JSONB;
  v_student_id UUID;
  v_student_exists BOOLEAN;
BEGIN
  -- Create the lecture
  INSERT INTO public.lectures (subject, teacher_id, section, lecture_date, lecture_time, lecture_number)
  VALUES (p_subject, p_teacher_id, p_section, p_lecture_date, p_lecture_time, p_lecture_number)
  RETURNING id INTO v_lecture_id;

  -- Insert attendance records
  FOR v_record IN SELECT * FROM jsonb_array_elements(p_attendance_records)
  LOOP
    v_student_id := (v_record->>'student_id')::UUID;
    
    -- Check if student exists in profiles table
    SELECT EXISTS(
      SELECT 1 FROM public.profiles 
      WHERE id = v_student_id AND role = 'student'
    ) INTO v_student_exists;
    
    -- Only insert if student exists
    IF v_student_exists THEN
      INSERT INTO public.attendance (student_id, lecture_id, date, status, marked_by)
      VALUES (
        v_student_id,
        v_lecture_id,
        p_lecture_date,
        v_record->>'status',
        p_teacher_id
      )
      ON CONFLICT (student_id, lecture_id) DO UPDATE
      SET status = EXCLUDED.status,
          marked_by = EXCLUDED.marked_by;
    ELSE
      RAISE WARNING 'Student ID % does not exist in profiles table', v_student_id;
    END IF;
  END LOOP;

  RETURN v_lecture_id;
END;
$$;

-- Create a debug function to check student data
CREATE OR REPLACE FUNCTION public.debug_student_data(p_section TEXT)
RETURNS TABLE (
  student_id UUID,
  student_roll TEXT,
  full_name TEXT,
  section TEXT,
  role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as student_id,
    p.student_id as student_roll,
    p.full_name,
    p.section,
    p.role
  FROM public.profiles p
  WHERE p.section = p_section
  ORDER BY p.student_id;
END;
$$;
