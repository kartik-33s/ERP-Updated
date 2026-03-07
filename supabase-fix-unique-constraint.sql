-- ========================================
-- COMPLETE FIX: Student Registration, Section Assignment & Attendance
-- PASTE THIS ENTIRE FILE INTO SUPABASE SQL EDITOR AND CLICK "RUN"
-- ========================================

-- ============================================
-- FIX 1: Update handle_new_user trigger to use UPSERT
-- This ensures re-registrations update the profile instead of failing
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id TEXT;
  v_section TEXT;
  v_role TEXT;
BEGIN
  v_student_id := NEW.raw_user_meta_data->>'student_id';
  v_role := NEW.raw_user_meta_data->>'role';
  v_section := NEW.raw_user_meta_data->>'section';
  
  -- Auto-calculate section from roll number if not provided
  IF v_role = 'student' AND v_student_id IS NOT NULL AND (v_section IS NULL OR v_section = '') THEN
    DECLARE
      v_roll_num INTEGER;
    BEGIN
      v_roll_num := CAST(v_student_id AS INTEGER);
      IF v_roll_num >= 2320000 AND v_roll_num <= 2320100 THEN
        v_section := 'A';
      ELSIF v_roll_num >= 2320101 AND v_roll_num <= 2320200 THEN
        v_section := 'B';
      ELSE
        v_section := 'A';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_section := 'A';
    END;
  END IF;

  -- UPSERT: Insert new profile or update existing one
  INSERT INTO public.profiles (id, email, full_name, role, student_id, department, section)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    v_role,
    v_student_id,
    NEW.raw_user_meta_data->>'department',
    v_section
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    student_id = EXCLUDED.student_id,
    department = EXCLUDED.department,
    section = COALESCE(EXCLUDED.section, public.profiles.section),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FIX 2: Fix existing students with NULL sections
-- ============================================
UPDATE public.profiles
SET section = CASE
  WHEN CAST(student_id AS INTEGER) >= 2320000 AND CAST(student_id AS INTEGER) <= 2320100 THEN 'A'
  WHEN CAST(student_id AS INTEGER) >= 2320101 AND CAST(student_id AS INTEGER) <= 2320200 THEN 'B'
  ELSE 'A'
END
WHERE role = 'student' 
  AND student_id IS NOT NULL 
  AND (section IS NULL OR section = '');

-- ============================================
-- FIX 3: Fix attendance foreign key constraints
-- ============================================
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_student_id_fkey;
ALTER TABLE public.attendance 
  ADD CONSTRAINT attendance_student_id_fkey 
  FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_marked_by_fkey;
ALTER TABLE public.attendance 
  ADD CONSTRAINT attendance_marked_by_fkey 
  FOREIGN KEY (marked_by) REFERENCES public.profiles(id);

-- ============================================
-- FIX 4: Recreate RPC function (without ON CONFLICT)
-- ============================================
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
      SELECT 1 FROM public.profiles WHERE id = v_student_id
    ) INTO v_student_exists;
    
    IF v_student_exists THEN
      INSERT INTO public.attendance (student_id, lecture_id, date, status, marked_by)
      VALUES (v_student_id, v_lecture_id, p_lecture_date, v_record->>'status', p_teacher_id);
    END IF;
  END LOOP;

  RETURN v_lecture_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_lecture_with_attendance(TEXT, UUID, TEXT, DATE, TIME, INTEGER, JSONB) TO authenticated;

-- ============================================
-- FIX 5: Reload schema cache
-- ============================================
NOTIFY pgrst, 'reload schema';

-- ============================================
-- VERIFY: Show results
-- ============================================
SELECT 'Students with sections:' as info;
SELECT id, full_name, student_id, section, role 
FROM public.profiles 
WHERE role = 'student' 
ORDER BY student_id;

SELECT '✅ ALL FIXES APPLIED! Students should now appear in attendance list.' as result;
