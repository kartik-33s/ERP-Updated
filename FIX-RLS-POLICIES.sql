-- Fix RLS policies to allow students to read active sessions

-- Add policy for students to view active sessions
CREATE POLICY "Students view active sessions" ON public.attendance_sessions
  FOR SELECT
  USING (is_active = true AND expires_at > NOW());

-- Add policy for students to insert their own attendance
CREATE POLICY "Students insert own attendance" ON public.attendance
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Add policy for students to insert their own attendance logs
CREATE POLICY "Students insert own logs" ON public.attendance_logs
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('attendance_sessions', 'attendance', 'attendance_logs');
