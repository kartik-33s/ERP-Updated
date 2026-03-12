-- ========================================
-- FINAL QR ATTENDANCE SETUP - COMPLETE
-- COPY THIS ENTIRE FILE AND RUN IN SUPABASE
-- ========================================

-- Clean up any partial installations
DROP TABLE IF EXISTS public.attendance_logs CASCADE;
DROP TABLE IF EXISTS public.attendance_sessions CASCADE;
DROP FUNCTION IF EXISTS public.calculate_distance CASCADE;
DROP FUNCTION IF EXISTS public.create_qr_attendance_session CASCADE;
DROP FUNCTION IF EXISTS public.mark_qr_attendance CASCADE;
DROP FUNCTION IF EXISTS public.get_teacher_active_session CASCADE;
DROP FUNCTION IF EXISTS public.deactivate_session CASCADE;

-- Create attendance_sessions table
CREATE TABLE public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID,
  teacher_id UUID,
  session_code TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  section TEXT NOT NULL,
  lecture_date DATE NOT NULL,
  lecture_time TIME NOT NULL,
  lecture_number INTEGER CHECK (lecture_number >= 1 AND lecture_number <= 8),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER DEFAULT 100,
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create attendance_logs table
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
  status TEXT CHECK (status IN ('present', 'late', 'rejected')) DEFAULT 'present',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_attendance_sessions_code ON public.attendance_sessions(session_code);
CREATE INDEX idx_attendance_sessions_active ON public.attendance_sessions(is_active, expires_at);
CREATE INDEX idx_attendance_sessions_teacher ON public.attendance_sessions(teacher_id);
CREATE INDEX idx_attendance_logs_session ON public.attendance_logs(session_id);
CREATE INDEX idx_attendance_logs_student ON public.attendance_logs(student_id);

-- Function 1: Calculate distance
CREATE FUNCTION public.calculate_distance(
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

-- Function 2: Create QR session
CREATE FUNCTION public.create_qr_attendance_session(
  p_subject TEXT, p_teacher_id UUID, p_section TEXT,
  p_lecture_date DATE, p_lecture_time TIME, p_lecture_number INTEGER,
  p_latitude DECIMAL, p_longitude DECIMAL,
  p_radius_meters INTEGER, p_duration_minutes INTEGER
)
RETURNS TABLE (session_id UUID, session_code TEXT, lecture_id UUID)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_lecture_id UUID;
  v_session_id UUID;
  v_session_code TEXT;
  v_starts_at TIMESTAMPTZ;
  v_expires_at TIMESTAMPTZ;
BEGIN
  v_lecture_id := gen_random_uuid();
  v_session_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
  v_starts_at := NOW();
  v_expires_at := NOW() + (p_duration_minutes || ' minutes')::INTERVAL;
  
  INSERT INTO public.attendance_sessions (
    lecture_id, teacher_id, session_code, subject, section,
    lecture_date, lecture_time, lecture_number,
    latitude, longitude, radius_meters,
    starts_at, expires_at, is_active
  ) VALUES (
    v_lecture_id, p_teacher_id, v_session_code, p_subject, p_section,
    p_lecture_date, p_lecture_time, p_lecture_number,
    p_latitude, p_longitude, p_radius_meters,
    v_starts_at, v_expires_at, true
  ) RETURNING id INTO v_session_id;
  
  RETURN QUERY SELECT v_session_id, v_session_code, v_lecture_id;
END;
$$;

-- Function 3: Mark attendance
CREATE FUNCTION public.mark_qr_attendance(
  p_session_code TEXT, p_student_id UUID,
  p_student_latitude DECIMAL, p_student_longitude DECIMAL,
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
  v_attendance_id UUID;
  v_log_id UUID;
  v_status TEXT;
  v_rejection_reason TEXT;
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
  
  IF v_distance <= v_session.radius_meters THEN
    v_status := 'present';
    v_rejection_reason := NULL;
    v_attendance_id := gen_random_uuid();
  ELSE
    v_status := 'rejected';
    v_rejection_reason := 'Location verification failed. Distance: ' || 
      ROUND(v_distance, 2) || 'm (Required: <' || v_session.radius_meters || 'm)';
    v_attendance_id := NULL;
  END IF;
  
  INSERT INTO public.attendance_logs (
    session_id, student_id, attendance_id,
    student_latitude, student_longitude, distance_meters,
    location_verified, status, rejection_reason,
    device_info, ip_address, user_agent
  ) VALUES (
    v_session.id, p_student_id, v_attendance_id,
    p_student_latitude, p_student_longitude, v_distance,
    (v_distance <= v_session.radius_meters), v_status, v_rejection_reason,
    p_device_info, p_ip_address, p_user_agent
  ) RETURNING id INTO v_log_id;
  
  IF v_status = 'present' THEN
    RETURN QUERY SELECT true, 'Attendance marked successfully'::TEXT, v_attendance_id, v_log_id;
  ELSE
    RETURN QUERY SELECT false, v_rejection_reason, NULL::UUID, v_log_id;
  END IF;
END;
$$;

-- Function 4: Get active session
CREATE FUNCTION public.get_teacher_active_session(p_teacher_id UUID)
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
    COUNT(l.id) as total_scans,
    COUNT(l.id) FILTER (WHERE l.status = 'present') as successful_scans
  FROM public.attendance_sessions s
  LEFT JOIN public.attendance_logs l ON l.session_id = s.id
  WHERE s.teacher_id = p_teacher_id AND s.is_active = true
    AND NOW() BETWEEN s.starts_at AND s.expires_at
  GROUP BY s.id ORDER BY s.created_at DESC LIMIT 1;
END;
$$;

-- Function 5: Deactivate session
CREATE FUNCTION public.deactivate_session(p_session_id UUID, p_teacher_id UUID)
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

-- Enable RLS
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Teachers view own sessions" ON public.attendance_sessions
  FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers create sessions" ON public.attendance_sessions
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers update own sessions" ON public.attendance_sessions
  FOR UPDATE USING (auth.uid() = teacher_id);

CREATE POLICY "Students view own logs" ON public.attendance_logs
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Teachers view session logs" ON public.attendance_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.attendance_sessions
      WHERE id = attendance_logs.session_id AND teacher_id = auth.uid())
  );

CREATE POLICY "Students create logs" ON public.attendance_logs
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Success message
SELECT '✅ SUCCESS! QR Attendance System Installed' as result;
SELECT 'Tables: attendance_sessions, attendance_logs' as tables;
SELECT 'Functions: 5 functions created' as functions;
SELECT 'Ready to use!' as status;
