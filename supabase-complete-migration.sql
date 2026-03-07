-- COMPLETE MIGRATION - Run this ONCE in Supabase SQL Editor
-- This adds the lecture number system and fixes all issues

-- ============================================
-- STEP 1: Add lecture_number column to lectures table
-- ============================================
DO $$ 
BEGIN
  -- Check if column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'lectures' 
    AND column_name = 'lecture_number'
  ) THEN
    ALTER TABLE public.lectures 
    ADD COLUMN lecture_number INTEGER CHECK (lecture_number >= 1 AND lecture_number <= 8);
    
    RAISE NOTICE 'Added lecture_number column to lectures table';
  ELSE
    RAISE NOTICE 'lecture_number column already exists';
  END IF;
END $$;

-- ============================================
-- STEP 2: Create indexes for better performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_lectures_lecture_number ON public.lectures(lecture_number);
CREATE INDEX IF NOT EXISTS idx_lectures_date_section ON public.lectures(lecture_date, section);

-- ============================================
-- STEP 3: Drop old RPC function if exists
-- ============================================
DROP FUNCTION IF EXISTS public.create_lecture_with_attendance(TEXT, UUID, TEXT, DATE, TIME, JSONB);
DROP FUNCTION IF EXISTS public.create_lecture_with_attendance(TEXT, UUID, TEXT, DATE, TIME, INTEGER, JSONB);

-- ============================================
-- STEP 4: Create new RPC function with lecture_number
-- ============================================
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
  v_inserted_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
BEGIN
  -- Create the lecture first
  INSERT INTO public.lectures (subject, teacher_id, section, lecture_date, lecture_time, lecture_number)
  VALUES (p_subject, p_teacher_id, p_section, p_lecture_date, p_lecture_time, p_lecture_number)
  RETURNING id INTO v_lecture_id;

  RAISE NOTICE 'Created lecture with ID: %', v_lecture_id;

  -- Insert attendance records one by one with validation
  FOR v_record IN SELECT * FROM jsonb_array_elements(p_attendance_records)
  LOOP
    BEGIN
      v_student_id := (v_record->>'student_id')::UUID;
      
      -- Check if student exists in profiles table
      SELECT EXISTS(
        SELECT 1 FROM public.profiles 
        WHERE id = v_student_id AND role = 'student'
      ) INTO v_student_exists;
      
      IF v_student_exists THEN
        -- Student exists, insert attendance
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
        
        v_inserted_count := v_inserted_count + 1;
      ELSE
        -- Student doesn't exist, skip and log
        RAISE WARNING 'Skipping student ID % - not found in profiles table', v_student_id;
        v_skipped_count := v_skipped_count + 1;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error processing student ID %: %', v_student_id, SQLERRM;
      v_skipped_count := v_skipped_count + 1;
    END;
  END LOOP;

  RAISE NOTICE 'Attendance saved: % inserted, % skipped', v_inserted_count, v_skipped_count;

  RETURN v_lecture_id;
END;
$$;

-- ============================================
-- STEP 5: Create helper functions for students
-- ============================================

-- Function to get lecture-wise attendance for a student
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

-- Function to get overall lecture-wise attendance stats for a student
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

-- ============================================
-- STEP 6: Grant permissions
-- ============================================
GRANT EXECUTE ON FUNCTION public.create_lecture_with_attendance(TEXT, UUID, TEXT, DATE, TIME, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_lecture_attendance(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_lecture_stats(UUID) TO authenticated;

-- ============================================
-- STEP 7: Verify everything
-- ============================================
SELECT '✅ Migration completed successfully!' as status;

-- Show what was created
SELECT 
  'lecture_number column exists: ' || 
  EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'lectures' 
    AND column_name = 'lecture_number'
  )::TEXT as verification;

SELECT 
  'RPC functions created: ' || COUNT(*)::TEXT as verification
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'create_lecture_with_attendance',
    'get_student_lecture_attendance',
    'get_student_lecture_stats'
  );
