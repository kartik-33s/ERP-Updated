-- ========================================
-- QR ATTENDANCE - STEP BY STEP SETUP
-- Run each section one at a time to identify issues
-- ========================================

-- STEP 1: Drop existing tables if they have issues
DROP TABLE IF EXISTS public.attendance_logs CASCADE;
DROP TABLE IF EXISTS public.attendance_sessions CASCADE;

-- STEP 2: Create attendance_sessions table
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

-- STEP 3: Create attendance_logs table
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

-- STEP 4: Create indexes
CREATE INDEX idx_attendance_sessions_code ON public.attendance_sessions(session_code);
CREATE INDEX idx_attendance_sessions_active ON public.attendance_sessions(is_active, expires_at);
CREATE INDEX idx_attendance_sessions_teacher ON public.attendance_sessions(teacher_id);
CREATE INDEX idx_attendance_logs_session ON public.attendance_logs(session_id);
CREATE INDEX idx_attendance_logs_student ON public.attendance_logs(student_id);

SELECT 'STEP 1-4 COMPLETE: Tables and indexes created' as status;
