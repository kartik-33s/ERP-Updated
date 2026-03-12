-- ========================================
-- SIMPLE QR SETUP - GUARANTEED TO WORK
-- Copy and run this ENTIRE file in Supabase
-- ========================================

-- Step 1: Clean up
DROP TABLE IF EXISTS public.attendance_logs CASCADE;
DROP TABLE IF EXISTS public.attendance_sessions CASCADE;
DROP FUNCTION IF EXISTS public.calculate_distance;
DROP FUNCTION IF EXISTS public.create_qr_attendance_session;
DROP FUNCTION IF EXISTS public.mark_qr_attendance;
DROP FUNCTION IF EXISTS public.get_teacher_active_session;
DROP FUNCTION IF EXISTS public.deactivate_session;

-- Step 2: Create tables
CREATE TABLE public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID,
  teacher_id UUID,
  session_code TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  section TEXT NOT NULL,
  lecture_date DATE NOT NULL,
  lecture_time TIME NOT NULL,
  lecture_number INTEGER,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER DEFAULT 100,
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID,
  attendance_id UUID,
  student_latitude DECIMAL(10, 8) NOT NULL,
  student_longitude DECIMAL(11, 8) NOT NULL,
  distance_meters DECIMAL(10, 2),
  location_verified BOOLEAN DEFAULT false,
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'present',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create indexes
CREATE INDEX idx_sessions_code ON public.attendance_sessions(session_code);
CREATE INDEX idx_sessions_teacher ON public.attendance_sessions(teacher_id);
CREATE INDEX idx_logs_session ON public.attendance_logs(session_id);

-- Step 4: Create distance function
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 DECIMAL, lon1 DECIMAL, lat2 DECIMAL, lon2 DECIMAL
)
RETURNS DECIMAL
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  earth_radius CONSTANT DECIMAL := 6371000;
  dlat DECIMAL; dlon DECIMAL; a DECIMAL; c DECIMAL;
BEGIN
  dlat := RADIANS(lat2 - lat1);
  dlon := RADIANS(lon2 - lon1);
  a := SIN(dlat/2) * SIN(dlat/2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlon/2) * SIN(dlon/2);
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  RETURN earth_radius * c;
END;
$$;

-- Step 5: Create session function
CREATE OR REPLACE FUNCTION public.create_qr_attendance_session(
  p_subject TEXT,
  p_teacher_id UUID,
  p_section TEXT,
  p_lecture_date DATE,
  p_lecture_time TIME,
  p_lecture_number INTEGER,
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_radius_meters INTEGER,
  p_duration_minutes INTEGER
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

-- Step 6: Create mark attendance function
CREATE OR REPLACE FUNCTION public.mark_qr_attendance(
  p_session_code TEXT,
  p_student_id UUID,
  p_student_latitude DECIMAL,
  p_student_longitude DECIMAL,
  p_device_info JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE (success BOOLEAN, message TEXT, attendance_id UUID, log_id UUID)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_session RECORD;
  v_distance DECIMAL;
  v_log_id UUID;
BEGIN
  SELECT * INTO v_session FROM public.attendance_sessions
  WHERE session_code = p_session_code AND is_active = true
    AND NOW() BETWEEN starts_at AND expires_at;
  
  IF v_session IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid or expired session'::TEXT, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;
  
  v_distance := public.calculate_distance(
    v_session.latitude, v_session.longitude,
    p_student_latitude, p_student_longitude
  );
  
  INSERT INTO public.attendance_logs (
    session_id, student_id, student_latitude, student_longitude,
    distance_meters, location_verified, status, rejection_reason,
    device_info, ip_address, user_agent
  ) VALUES (
    v_session.id, p_student_id, p_student_latitude, p_student_longitude,
    v_distance, (v_distance <= v_session.radius_meters),
    CASE WHEN v_distance <= v_session.radius_meters THEN 'present' ELSE 'rejected' END,
    CASE WHEN v_distance > v_session.radius_meters 
      THEN 'Distance: ' || ROUND(v_distance, 2) || 'm (Required: <' || v_session.radius_meters || 'm)'
      ELSE NULL END,
    p_device_info, p_ip_address, p_user_agent
  ) RETURNING id INTO v_log_id;
  
  IF v_distance <= v_session.radius_meters THEN
    RETURN QUERY SELECT true, 'Attendance marked successfully'::TEXT, gen_random_uuid(), v_log_id;
  ELSE
    RETURN QUERY SELECT false, 
      ('Distance: ' || ROUND(v_distance, 2) || 'm (Required: <' || v_session.radius_meters || 'm)')::TEXT,
      NULL::UUID, v_log_id;
  END IF;
END;
$$;

-- Step 7: Get active session function
CREATE OR REPLACE FUNCTION public.get_teacher_active_session(p_teacher_id UUID)
RETURNS TABLE (
  session_id UUID, session_code TEXT, subject TEXT, section TEXT,
  lecture_number INTEGER, starts_at TIMESTAMPTZ, expires_at TIMESTAMPTZ,
  total_scans BIGINT, successful_scans BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.session_code, s.subject, s.section, s.lecture_number,
    s.starts_at, s.expires_at,
    COUNT(l.id), COUNT(l.id) FILTER (WHERE l.status = 'present')
  FROM public.attendance_sessions s
  LEFT JOIN public.attendance_logs l ON l.session_id = s.id
  WHERE s.teacher_id = p_teacher_id AND s.is_active = true
    AND NOW() BETWEEN s.starts_at AND s.expires_at
  GROUP BY s.id ORDER BY s.created_at DESC LIMIT 1;
END;
$$;

-- Step 8: Deactivate session function
CREATE OR REPLACE FUNCTION public.deactivate_session(
  p_session_id UUID,
  p_teacher_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.attendance_sessions
  SET is_active = false, updated_at = NOW()
  WHERE id = p_session_id AND teacher_id = p_teacher_id;
  RETURN FOUND;
END;
$$;

-- Step 9: Enable RLS
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- Step 10: Create policies
DROP POLICY IF EXISTS "Teachers view sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Teachers create sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Teachers update sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Students view logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Teachers view logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Students create logs" ON public.attendance_logs;

CREATE POLICY "Teachers view sessions" ON public.attendance_sessions
  FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers create sessions" ON public.attendance_sessions
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers update sessions" ON public.attendance_sessions
  FOR UPDATE USING (auth.uid() = teacher_id);

CREATE POLICY "Students view logs" ON public.attendance_logs
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Teachers view logs" ON public.attendance_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.attendance_sessions
      WHERE id = attendance_logs.session_id AND teacher_id = auth.uid())
  );

CREATE POLICY "Students create logs" ON public.attendance_logs
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Verify
SELECT '✅ SETUP COMPLETE!' as status;
SELECT 'Run this query to verify:' as next_step;
SELECT 'SELECT routine_name FROM information_schema.routines WHERE routine_schema = ''public'' AND routine_name LIKE ''%qr%'';' as verification_query;
