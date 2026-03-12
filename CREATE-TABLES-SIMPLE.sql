-- ========================================
-- SIMPLE TABLE CREATION
-- Copy line by line if needed
-- ========================================

-- Step 1: Drop if exists
DROP TABLE IF EXISTS attendance_logs CASCADE;
DROP TABLE IF EXISTS attendance_sessions CASCADE;

-- Step 2: Create attendance_sessions
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

-- Step 3: Create attendance_logs
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

-- Step 4: Create indexes
CREATE INDEX idx_sessions_code ON attendance_sessions(session_code);
CREATE INDEX idx_sessions_teacher ON attendance_sessions(teacher_id);
CREATE INDEX idx_logs_session ON attendance_logs(session_id);

-- Step 5: Enable RLS
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

-- Step 6: Create policies
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

-- Verify
SELECT 'SUCCESS!' as status;
