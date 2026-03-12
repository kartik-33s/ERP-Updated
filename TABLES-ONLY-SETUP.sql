-- ========================================
-- CREATE TABLES ONLY (No Functions Needed!)
-- The API now uses direct queries instead of RPC
-- RUN THIS IN SUPABASE SQL EDITOR
-- ========================================

-- Clean up
DROP TABLE IF EXISTS public.attendance_logs CASCADE;
DROP TABLE IF EXISTS public.attendance_sessions CASCADE;

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
  status TEXT DEFAULT 'present',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_sessions_code ON public.attendance_sessions(session_code);
CREATE INDEX idx_sessions_teacher ON public.attendance_sessions(teacher_id);
CREATE INDEX idx_sessions_active ON public.attendance_sessions(is_active, expires_at);
CREATE INDEX idx_logs_session ON public.attendance_logs(session_id);
CREATE INDEX idx_logs_student ON public.attendance_logs(student_id);

-- Enable RLS
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Teachers view sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Teachers create sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Teachers update sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Students view logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Teachers view logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Students create logs" ON public.attendance_logs;

-- Create RLS policies
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

-- Success!
SELECT '✅ TABLES CREATED SUCCESSFULLY!' as status;
SELECT 'No functions needed - API uses direct queries' as info;
SELECT 'You can now test the QR attendance system!' as next_step;
