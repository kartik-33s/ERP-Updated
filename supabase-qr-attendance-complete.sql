-- ========================================
-- QR & GEO-ENABLED ATTENDANCE SYSTEM - COMPLETE SETUP
-- This script checks for existing tables and creates only what's needed
-- COPY THIS ENTIRE FILE AND PASTE INTO SUPABASE SQL EDITOR
-- THEN CLICK "RUN"
-- ========================================

-- First, let's check if profiles table exists, if not create it
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT,
      full_name TEXT,
      role TEXT CHECK (role IN ('student', 'teacher')),
      student_id TEXT,
      department TEXT,
      section TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view their own profile"
      ON public.profiles FOR SELECT
      USING (auth.uid() = id);
      
    CREATE POLICY "Teachers can view all profiles"
      ON public.profiles FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'teacher'
        )
      );
  END IF;
END $$;

-- Check if lectures table exists, if not create it
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lectures') THEN
    CREATE TABLE public.lectures (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subject TEXT NOT NULL,
      teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
      section TEXT NOT NULL,
      lecture_date DATE NOT NULL,
      lecture_time TIME NOT NULL,
      lecture_number INTEGER CHECK (lecture_number >= 1 AND lecture_number <= 8),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Teachers can create lectures"
      ON public.lectures FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'teacher'
        )
      );
  ELSE
    -- Add lecture_number column if it doesn't exist
    ALTER TABLE public.lectures 
    ADD COLUMN IF NOT EXISTS lecture_number INTEGER CHECK (lecture_number >= 1 AND lecture_number <= 8);
  END IF;
END $$;

-- Check if attendance table exists, if not create it
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance') THEN
    CREATE TABLE public.attendance (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
      lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      status TEXT CHECK (status IN ('present', 'absent', 'late')) NOT NULL,
      marked_by UUID REFERENCES public.profiles(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Students can view their own attendance"
      ON public.attendance FOR SELECT
      USING (auth.uid() = student_id);
      
    CREATE POLICY "Teachers can view all attendance"
      ON public.attendance FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'teacher'
        )
      );
  END IF;
END $$;

-- Now create QR attendance tables
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_code TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  section TEXT NOT NULL,
  lecture_date DATE NOT NULL,
  lecture_time TIME NOT NULL,
  lecture_number INTEGER CHECK (lecture_number >= 1 AND lecture_number <= 8),
  
  -- Geo-fencing data
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER DEFAULT 100,
  
  -- Session timing
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  attendance_id UUID REFERENCES public.attendance(id) ON DELETE SET NULL,
  
  -- Location data
  student_latitude DECIMAL(10, 8) NOT NULL,
  student_longitude DECIMAL(11, 8) NOT NULL,
  distance_meters DECIMAL(10, 2),
  location_verified BOOLEAN DEFAULT false,
  
  -- Device & security info
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status
  status TEXT CHECK (status IN ('present', 'late', 'rejected')) DEFAULT 'present',
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_code ON public.attendance_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_active ON public.attendance_sessions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_teacher ON public.attendance_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_session ON public.attendance_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_student ON public.attendance_logs(student_id);

-- Function to calculate distance between two coordinates (Haversine formula)
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 DECIMAL, lon1 DECIMAL,
  lat2 DECIMAL, lon2 DECIMAL
)
RETURNS DECIMAL
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  earth_radius CONSTANT DECIMAL := 6371000; -- Earth radius in meters
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := RADIANS(lat2 - lat1);
  dlon := RADIANS(lon2 - lon1);
  
  a := SIN(dlat/2) * SIN(dlat/2) + 
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
       SIN(dlon/2) * SIN(dlon/2);
  
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  
  RETURN earth_radius * c;
END;
$$;

-- Function to create QR attendance session
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
RETURNS TABLE (
  session_id UUID,
  session_code TEXT,
  lecture_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lecture_id UUID;
  v_session_id UUID;
  v_session_code TEXT;
  v_starts_at TIMESTAMPTZ;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Create lecture record
  INSERT INTO public.lectures (subject, teacher_id, section, lecture_date, lecture_time, lecture_number)
  VALUES (p_subject, p_teacher_id, p_section, p_lecture_date, p_lecture_time, p_lecture_number)
  RETURNING id INTO v_lecture_id;
  
  -- Generate unique session code
  v_session_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
  
  -- Set session timing
  v_starts_at := NOW();
  v_expires_at := NOW() + (p_duration_minutes || ' minutes')::INTERVAL;
  
  -- Create attendance session
  INSERT INTO public.attendance_sessions (
    lecture_id, teacher_id, session_code, subject, section,
    lecture_date, lecture_time, lecture_number,
    latitude, longitude, radius_meters,
    starts_at, expires_at, is_active
  )
  VALUES (
    v_lecture_id, p_teacher_id, v_session_code, p_subject, p_section,
    p_lecture_date, p_lecture_time, p_lecture_number,
    p_latitude, p_longitude, p_radius_meters,
    v_starts_at, v_expires_at, true
  )
  RETURNING id INTO v_session_id;
  
  RETURN QUERY SELECT v_session_id, v_session_code, v_lecture_id;
END;
$$;

-- Function to mark attendance via QR scan
CREATE OR REPLACE FUNCTION public.mark_qr_attendance(
  p_session_code TEXT,
  p_student_id UUID,
  p_student_latitude DECIMAL,
  p_student_longitude DECIMAL,
  p_device_info JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  attendance_id UUID,
  log_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session RECORD;
  v_distance DECIMAL;
  v_attendance_id UUID;
  v_log_id UUID;
  v_status TEXT;
  v_rejection_reason TEXT;
  v_student_section TEXT;
BEGIN
  -- Get student section
  SELECT section INTO v_student_section
  FROM public.profiles
  WHERE id = p_student_id AND role = 'student';
  
  IF v_student_section IS NULL THEN
    RETURN QUERY SELECT false, 'Student not found'::TEXT, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;
  
  -- Get session details
  SELECT * INTO v_session
  FROM public.attendance_sessions
  WHERE session_code = p_session_code
    AND is_active = true
    AND NOW() BETWEEN starts_at AND expires_at;
  
  IF v_session IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid or expired session'::TEXT, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;
  
  -- Verify section match
  IF v_session.section != v_student_section THEN
    RETURN QUERY SELECT false, 'This session is not for your section'::TEXT, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if already marked
  IF EXISTS (
    SELECT 1 FROM public.attendance
    WHERE lecture_id = v_session.lecture_id AND student_id = p_student_id
  ) THEN
    RETURN QUERY SELECT false, 'Attendance already marked for this lecture'::TEXT, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;
  
  -- Calculate distance
  v_distance := public.calculate_distance(
    v_session.latitude, v_session.longitude,
    p_student_latitude, p_student_longitude
  );
  
  -- Verify location
  IF v_distance <= v_session.radius_meters THEN
    v_status := 'present';
    v_rejection_reason := NULL;
    
    -- Create attendance record
    INSERT INTO public.attendance (student_id, lecture_id, date, status, marked_by)
    VALUES (p_student_id, v_session.lecture_id, v_session.lecture_date, 'present', v_session.teacher_id)
    RETURNING id INTO v_attendance_id;
    
  ELSE
    v_status := 'rejected';
    v_rejection_reason := 'Location verification failed. Distance: ' || ROUND(v_distance, 2) || 'm (Required: <' || v_session.radius_meters || 'm)';
    v_attendance_id := NULL;
  END IF;
  
  -- Create attendance log
  INSERT INTO public.attendance_logs (
    session_id, student_id, attendance_id,
    student_latitude, student_longitude, distance_meters,
    location_verified, status, rejection_reason,
    device_info, ip_address, user_agent
  )
  VALUES (
    v_session.id, p_student_id, v_attendance_id,
    p_student_latitude, p_student_longitude, v_distance,
    (v_distance <= v_session.radius_meters), v_status, v_rejection_reason,
    p_device_info, p_ip_address, p_user_agent
  )
  RETURNING id INTO v_log_id;
  
  IF v_status = 'present' THEN
    RETURN QUERY SELECT true, 'Attendance marked successfully'::TEXT, v_attendance_id, v_log_id;
  ELSE
    RETURN QUERY SELECT false, v_rejection_reason, NULL::UUID, v_log_id;
  END IF;
END;
$$;

-- Function to get active session for teacher
CREATE OR REPLACE FUNCTION public.get_teacher_active_session(p_teacher_id UUID)
RETURNS TABLE (
  session_id UUID,
  session_code TEXT,
  subject TEXT,
  section TEXT,
  lecture_number INTEGER,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  total_scans BIGINT,
  successful_scans BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.session_code,
    s.subject,
    s.section,
    s.lecture_number,
    s.starts_at,
    s.expires_at,
    COUNT(l.id) as total_scans,
    COUNT(l.id) FILTER (WHERE l.status = 'present') as successful_scans
  FROM public.attendance_sessions s
  LEFT JOIN public.attendance_logs l ON l.session_id = s.id
  WHERE s.teacher_id = p_teacher_id
    AND s.is_active = true
    AND NOW() BETWEEN s.starts_at AND s.expires_at
  GROUP BY s.id
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;

-- Function to deactivate session
CREATE OR REPLACE FUNCTION public.deactivate_session(p_session_id UUID, p_teacher_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.attendance_sessions
  SET is_active = false, updated_at = NOW()
  WHERE id = p_session_id AND teacher_id = p_teacher_id;
  
  RETURN FOUND;
END;
$$;

-- Enable Row Level Security on new tables
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can view their own sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Teachers can create sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Teachers can update their own sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Students can view their own logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Teachers can view logs for their sessions" ON public.attendance_logs;
DROP POLICY IF EXISTS "Students can create logs" ON public.attendance_logs;

-- RLS Policies for attendance_sessions
CREATE POLICY "Teachers can view their own sessions"
  ON public.attendance_sessions FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create sessions"
  ON public.attendance_sessions FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own sessions"
  ON public.attendance_sessions FOR UPDATE
  USING (auth.uid() = teacher_id);

-- RLS Policies for attendance_logs
CREATE POLICY "Students can view their own logs"
  ON public.attendance_logs FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view logs for their sessions"
  ON public.attendance_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions
      WHERE id = attendance_logs.session_id
      AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can create logs"
  ON public.attendance_logs FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Verify
SELECT 'SUCCESS! QR & Geo-enabled attendance system created.' as result;
SELECT 'Tables created: attendance_sessions, attendance_logs' as info;
SELECT 'Functions created: 5 functions for QR attendance' as info2;
