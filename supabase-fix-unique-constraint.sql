-- ========================================
-- FIX: Attendance Foreign Key Constraint
-- PASTE THIS INTO SUPABASE SQL EDITOR AND CLICK "RUN"
-- ========================================

-- Step 1: Drop the old foreign key (whatever it references)
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_student_id_fkey;

-- Step 2: Recreate it pointing to profiles(id), which is where student data lives
ALTER TABLE public.attendance 
  ADD CONSTRAINT attendance_student_id_fkey 
  FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Step 3: Also fix marked_by FK if needed
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_marked_by_fkey;
ALTER TABLE public.attendance 
  ADD CONSTRAINT attendance_marked_by_fkey 
  FOREIGN KEY (marked_by) REFERENCES public.profiles(id);

-- Step 4: Recreate the RPC function (clean version without ON CONFLICT)
DROP FUNCTION IF EXISTS public.create_lecture_with_attendance(TEXT, UUID, TEXT, DATE, TIME, JSONB);
DROP FUNCTION IF EXISTS public.create_lecture_with_attendance(TEXT, UUID, TEXT, DATE, TIME, INTEGER, JSONB);

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
      WHERE id = v_student_id
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

GRANT EXECUTE ON FUNCTION public.create_lecture_with_attendance(TEXT, UUID, TEXT, DATE, TIME, INTEGER, JSONB) TO authenticated;

-- Step 5: Reload schema cache
NOTIFY pgrst, 'reload schema';

-- Step 6: Verify
SELECT 'Foreign key constraints on attendance:' as info;
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'attendance' 
  AND tc.constraint_type = 'FOREIGN KEY';

SELECT '✅ SUCCESS! Foreign keys fixed - attendance should work now.' as result;
