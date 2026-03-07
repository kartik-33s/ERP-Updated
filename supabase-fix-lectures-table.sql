-- Complete fix for lectures table
-- This will ensure the section column exists and reload the cache

-- ============================================
-- STEP 1: Drop and recreate lectures table
-- ============================================
-- WARNING: This will delete all existing lecture data
-- Comment out if you want to keep existing data

DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.lectures CASCADE;

-- ============================================
-- STEP 2: Create lectures table with section column
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
-- STEP 3: Create attendance table
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
-- STEP 4: Enable RLS
-- ============================================
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: Create policies for lectures
-- ============================================
CREATE POLICY "Teachers can create lectures"
  ON public.lectures
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Teachers can view lectures"
  ON public.lectures
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Students can view lectures"
  ON public.lectures
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- ============================================
-- STEP 6: Create policies for attendance
-- ============================================
CREATE POLICY "Teachers can create attendance"
  ON public.attendance
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Teachers can view attendance"
  ON public.attendance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Students can view their attendance"
  ON public.attendance
  FOR SELECT
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
-- STEP 9: Verify the structure
-- ============================================
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'lectures'
ORDER BY ordinal_position;

SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'attendance'
ORDER BY ordinal_position;
