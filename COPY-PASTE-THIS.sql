-- ========================================
-- COPY THIS ENTIRE FILE AND PASTE INTO SUPABASE SQL EDITOR
-- THEN CLICK "RUN"
-- ========================================

-- Add lecture_number column
ALTER TABLE public.lectures 
ADD COLUMN IF NOT EXISTS lecture_number INTEGER CHECK (lecture_number >= 1 AND lecture_number <= 8);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lectures_lecture_number ON public.lectures(lecture_number);
CREATE INDEX IF NOT EXISTS idx_lectures_date_section ON public.lectures(lecture_date, section);

-- Drop old function
DROP FUNCTION IF EXISTS public.create_lecture_with_attendance(TEXT, UUID, TEXT, DATE, TIME, JSONB);
DROP FUNCTION IF EXISTS public.create_lecture_with_attendance(TEXT, UUID, TEXT, DATE, TIME, INTEGER, JSONB);

-- Create new function
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

-- Create student functions
CREATE OR REPLACE FUNCTION public.get_student_lecture_stats(p_student_id UUID)
RETURNS TABLE (
  lecture_number INTEGER,
  total_lectures INTEGER,
  present_count INTEGER,
  absent_count INTEGER,
  attendance_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.lecture_number,
    COUNT(*)::INTEGER as total_lectures,
    COUNT(*) FILTER (WHERE a.status = 'present')::INTEGER as present_count,
    COUNT(*) FILTER (WHERE a.status = 'absent')::INTEGER as absent_count,
    ROUND((COUNT(*) FILTER (WHERE a.status = 'present')::NUMERIC / NULLIF(COUNT(*)::NUMERIC, 0)) * 100, 2) as attendance_percentage
  FROM public.lectures l
  INNER JOIN public.attendance a ON a.lecture_id = l.id
  WHERE a.student_id = p_student_id
    AND l.section = (SELECT section FROM public.profiles WHERE id = p_student_id)
  GROUP BY l.lecture_number
  ORDER BY l.lecture_number;
END;
$$;

-- Verify
SELECT 'SUCCESS! Column added and functions created.' as result;
