-- ========================================
-- CREATE TABLES - FINAL VERSION
-- This WILL work - copy and run entire file
-- ========================================

-- Create attendance_sessions table
CREATE TABLE attendance_sessions (
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
CREATE TABLE attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
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
CREATE INDEX idx_sessions_code ON attendance_sessions(session_code);
CREATE INDEX idx_sessions_teacher ON attendance_sessions(teacher_id);
CREATE INDEX idx_logs_session ON attendance_logs(session_id);

-- Grant permissions
GRANT ALL ON attendance_sessions TO postgres, anon, authenticated, service_role;
GRANT ALL ON attendance_logs TO postgres, anon, authenticated, service_role;

-- Enable RLS
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Teachers view sessions" ON attendance_sessions
  FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers create sessions" ON attendance_sessions
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers update sessions" ON attendance_sessions
  FOR UPDATE USING (auth.uid() = teacher_id);

CREATE POLICY "Students view logs" ON attendance_logs
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Teachers view logs" ON attendance_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM attendance_sessions
      WHERE id = attendance_logs.session_id AND teacher_id = auth.uid())
  );

CREATE POLICY "Students create logs" ON attendance_logs
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Force reload
NOTIFY pgrst, 'reload schema';

-- Success!
SELECT '✅ TABLES CREATED SUCCESSFULLY!' as status;
SELECT 'Wait 30 seconds then test your app' as next_step;
