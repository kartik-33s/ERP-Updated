-- ========================================
-- FIX: Create function with alphabetical parameter order
-- This matches what Supabase expects in the schema cache
-- RUN THIS IN SUPABASE SQL EDITOR
-- ========================================

-- Drop and recreate with correct parameter order
DROP FUNCTION IF EXISTS public.create_qr_attendance_session;

-- Create with parameters in ALPHABETICAL order (as Supabase expects)
CREATE OR REPLACE FUNCTION public.create_qr_attendance_session(
  p_duration_minutes INTEGER,
  p_latitude DECIMAL,
  p_lecture_date DATE,
  p_lecture_number INTEGER,
  p_lecture_time TIME,
  p_longitude DECIMAL,
  p_radius_meters INTEGER,
  p_section TEXT,
  p_subject TEXT,
  p_teacher_id UUID
)
RETURNS TABLE (session_id UUID, session_code TEXT, lecture_id UUID)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_lecture_id UUID;
  v_session_id UUID;
  v_session_code TEXT;
BEGIN
  v_lecture_id := gen_random_uuid();
  v_session_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
  
  INSERT INTO public.attendance_sessions (
    lecture_id, teacher_id, session_code, subject, section,
    lecture_date, lecture_time, lecture_number,
    latitude, longitude, radius_meters,
    starts_at, expires_at, is_active
  ) VALUES (
    v_lecture_id, p_teacher_id, v_session_code, p_subject, p_section,
    p_lecture_date, p_lecture_time, p_lecture_number,
    p_latitude, p_longitude, p_radius_meters,
    NOW(), NOW() + (p_duration_minutes || ' minutes')::INTERVAL, true
  ) RETURNING id INTO v_session_id;
  
  RETURN QUERY SELECT v_session_id, v_session_code, v_lecture_id;
END;
$$;

-- Verify it was created
SELECT 'Function created with alphabetical parameters!' as status;
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'create_qr_attendance_session';
