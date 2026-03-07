-- Recreate lectures and attendance tables from scratch
-- WARNING: This will delete all existing lecture and attendance data!
-- Only run this if you're okay with losing that data

-- ============================================
-- STEP 1: Backup existing data (optional)
-- ============================================
-- Uncomment to create backup tables
-- CREATE TABLE lectures_backup AS SELECT * FROM public.lectures;
-- CREATE TABLE attendance_backup AS SELECT * FROM public.attendance;

-- ============================================
-- STEP 2: Drop existing tables
-- ============================================
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.lectures CASCADE;

-- ============================================
-- STEP 3: Create lectures table with section
-- ============================================
CREATE TABLE public.lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  lecture_date DATE NOT NULL,
  lecture_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 4: Create attendance table
-- ============================================
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent')) NOT NULL,
  marked_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, lecture_id)
);

-- ============================================
-- STEP 5: Enable RLS
-- ============================================
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: Create policies
-- ============================================

-- Lectures policies
DROP POLICY IF EXISTS "Teachers can create lectures" ON public.lectures;
DROP POLICY IF EXISTS "Teachers can view lectures" ON public.lectures;
DROP POLICY IF EXISTS "Students can view lectures" ON public.lectures;

CREATE POLICY "Teachers can create lectures"
  ON public.lectures FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
  );

CREATE POLICY "Teachers can view lectures"
  ON public.lectures FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
  );

CREATE POLICY "Students can view lectures"
  ON public.lectures FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student')
  );

-- Attendance policies
DROP POLICY IF EXISTS "Teachers can create attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can view attendance" ON public.attendance;
DROP POLICY IF EXISTS "Students can view their attendance" ON public.attendance;

CREATE POLICY "Teachers can create attendance"
  ON public.attendance FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
  );

CREATE POLICY "Teachers can view attendance"
  ON public.attendance FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
  );

CREATE POLICY "Students can view their attendance"
  ON public.attendance FOR SELECT
  USING (auth.uid() = student_id);

-- ============================================
-- STEP 7: Create indexes
-- ============================================
CREATE INDEX idx_lectures_teacher_id ON public.lectures(teacher_id);
CREATE INDEX idx_lectures_section ON public.lectures(section);
CREATE INDEX idx_lectures_date ON public.lectures(lecture_date);
CREATE INDEX idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX idx_attendance_lecture_id ON public.attendance(lecture_id);

-- ============================================
-- STEP 8: Reload schema cache
-- ============================================
NOTIFY pgrst, 'reload schema';

-- ============================================
-- STEP 9: Verify
-- ============================================
SELECT 'Lectures table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'lectures'
ORDER BY ordinal_position;

SELECT 'Attendance table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'attendance'
ORDER BY ordinal_position;

SELECT '✅ Tables recreated successfully with section column!' as result;
