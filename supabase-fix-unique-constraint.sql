-- ========================================
-- PASTE THIS INTO SUPABASE SQL EDITOR AND CLICK "RUN"
-- Fixes: "there is no unique or exclusion constraint matching the ON CONFLICT specification"
-- ========================================

-- Drop old function versions
DROP FUNCTION IF EXISTS public.create_lecture_with_attendance(TEXT, UUID, TEXT, DATE, TIME, JSONB);
DROP FUNCTION IF EXISTS public.create_lecture_with_attendance(TEXT, UUID, TEXT, DATE, TIME, INTEGER, JSONB);

-- Recreate the function WITHOUT ON CONFLICT (not needed since lecture_id is always new)
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
  INSERT INTO public.lectures (subject, teacher_id, section, lecture_date, lecture_time, lecture_number)
  VALUES (p_subject, p_teacher_id, p_section, p_lecture_date, p_lecture_time, p_lecture_number)
  RETURNING id INTO v_lecture_id;

  FOR v_record IN SELECT * FROM jsonb_array_elements(p_attendance_records)
  LOOP
    v_student_id := (v_record->>'student_id')::UUID;
    
    SELECT EXISTS(
      SELECT 1 FROM public.profiles 
      WHERE id = v_student_id AND role = 'student'
    ) INTO v_student_exists;
    
    IF v_student_exists THEN
      INSERT INTO public.attendance (student_id, lecture_id, date, status, marked_by)
      VALUES (
        v_student_id,
        v_lecture_id,
        p_lecture_date,
        v_record->>'status',
        p_teacher_id
      );
    END IF;
  END LOOP;

  RETURN v_lecture_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_lecture_with_attendance(TEXT, UUID, TEXT, DATE, TIME, INTEGER, JSONB) TO authenticated;

SELECT 'SUCCESS! Function fixed - attendance should work now.' as result;
