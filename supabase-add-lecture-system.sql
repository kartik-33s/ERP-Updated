-- Add lecture number system to the database
-- Lecture schedule: 
-- Lecture 1: 9:15 - 10:10
-- Lecture 2: 10:10 - 11:05
-- Lecture 3: 11:05 - 12:00
-- Lecture 4: 12:00 - 12:55
-- Lecture 5: 12:55 - 1:50 (Lunch)
-- Lecture 6: 1:50 - 2:45
-- Lecture 7: 2:45 - 3:40
-- Lecture 8: 3:40 - 4:35

-- Add lecture_number column to lectures table
ALTER TABLE public.lectures 
ADD COLUMN IF NOT EXISTS lecture_number INTEGER CHECK (lecture_number >= 1 AND lecture_number <= 8);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_lectures_lecture_number ON public.lectures(lecture_number);
CREATE INDEX IF NOT EXISTS idx_lectures_date_section ON public.lectures(lecture_date, section);

-- Update the RPC function to include lecture number
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
BEGIN
  -- Create the lecture
  INSERT INTO public.lectures (subject, teacher_id, section, lecture_date, lecture_time, lecture_number)
  VALUES (p_subject, p_teacher_id, p_section, p_lecture_date, p_lecture_time, p_lecture_number)
  RETURNING id INTO v_lecture_id;

  -- Insert attendance records
  FOR v_record IN SELECT * FROM jsonb_array_elements(p_attendance_records)
  LOOP
    INSERT INTO public.attendance (student_id, lecture_id, date, status, marked_by)
    VALUES (
      (v_record->>'student_id')::UUID,
      v_lecture_id,
      p_lecture_date,
      v_record->>'status',
      p_teacher_id
    )
    ON CONFLICT (student_id, lecture_id) DO UPDATE
    SET status = EXCLUDED.status,
        marked_by = EXCLUDED.marked_by;
  END LOOP;

  RETURN v_lecture_id;
END;
$$;

-- Create a function to get lecture-wise attendance for a student
CREATE OR REPLACE FUNCTION public.get_student_lecture_attendance(
  p_student_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  lecture_number INTEGER,
  status TEXT,
  subject TEXT,
  lecture_time TIME
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.lecture_number,
    COALESCE(a.status, 'not_marked') as status,
    l.subject,
    l.lecture_time
  FROM 
    generate_series(1, 8) as lecture_num
  LEFT JOIN public.lectures l ON l.lecture_number = lecture_num 
    AND l.lecture_date = p_date
    AND l.section = (SELECT section FROM public.profiles WHERE id = p_student_id)
  LEFT JOIN public.attendance a ON a.lecture_id = l.id 
    AND a.student_id = p_student_id
  ORDER BY lecture_num;
END;
$$;

-- Create a function to get overall lecture-wise attendance stats for a student
CREATE OR REPLACE FUNCTION public.get_student_lecture_stats(
  p_student_id UUID
)
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
    ROUND(
      (COUNT(*) FILTER (WHERE a.status = 'present')::NUMERIC / 
       NULLIF(COUNT(*)::NUMERIC, 0)) * 100, 
      2
    ) as attendance_percentage
  FROM 
    public.lectures l
  INNER JOIN public.attendance a ON a.lecture_id = l.id
  WHERE 
    a.student_id = p_student_id
    AND l.section = (SELECT section FROM public.profiles WHERE id = p_student_id)
  GROUP BY l.lecture_number
  ORDER BY l.lecture_number;
END;
$$;
