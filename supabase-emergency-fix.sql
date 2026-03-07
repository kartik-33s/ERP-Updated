-- EMERGENCY FIX - Run this immediately in Supabase SQL Editor
-- This will replace the broken RPC function with a working one

-- Drop the old function first
DROP FUNCTION IF EXISTS public.create_lecture_with_attendance(TEXT, UUID, TEXT, DATE, TIME, INTEGER, JSONB);

-- Create the new function with proper error handling
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_lecture_with_attendance(TEXT, UUID, TEXT, DATE, TIME, INTEGER, JSONB) TO authenticated;

-- Test the function exists
SELECT 'Function created successfully!' as status;
