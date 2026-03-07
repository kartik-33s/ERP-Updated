-- Complete database schema for ERP System
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
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

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view all profiles" ON public.profiles;

-- Create policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Teachers can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- ============================================
-- 2. LECTURES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  lecture_date DATE NOT NULL,
  lecture_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can create lectures" ON public.lectures;
DROP POLICY IF EXISTS "Teachers can view their lectures" ON public.lectures;
DROP POLICY IF EXISTS "Students can view lectures" ON public.lectures;

-- Create policies
CREATE POLICY "Teachers can create lectures"
  ON public.lectures
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Teachers can view their lectures"
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
-- 3. ATTENDANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent')) NOT NULL,
  marked_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, lecture_id)
);

-- Enable Row Level Security
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can create attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can view attendance" ON public.attendance;
DROP POLICY IF EXISTS "Students can view their attendance" ON public.attendance;

-- Create policies
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
-- 4. OD REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.od_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.od_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can create od requests" ON public.od_requests;
DROP POLICY IF EXISTS "Students can view their od requests" ON public.od_requests;
DROP POLICY IF EXISTS "Teachers can view all od requests" ON public.od_requests;
DROP POLICY IF EXISTS "Teachers can update od requests" ON public.od_requests;

-- Create policies
CREATE POLICY "Students can create od requests"
  ON public.od_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = student_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

CREATE POLICY "Students can view their od requests"
  ON public.od_requests
  FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view all od requests"
  ON public.od_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update od requests"
  ON public.od_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- ============================================
-- 5. TRIGGERS
-- ============================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id TEXT;
  v_section TEXT;
  v_role TEXT;
BEGIN
  -- Get values from metadata
  v_student_id := NEW.raw_user_meta_data->>'student_id';
  v_role := NEW.raw_user_meta_data->>'role';
  v_section := NEW.raw_user_meta_data->>'section';
  
  -- If section is not provided but student_id is, calculate it
  IF v_role = 'student' AND v_student_id IS NOT NULL AND v_section IS NULL THEN
    DECLARE
      v_roll_num INTEGER;
    BEGIN
      v_roll_num := CAST(v_student_id AS INTEGER);
      IF v_roll_num >= 2320000 AND v_roll_num <= 2320100 THEN
        v_section := 'A';
      ELSIF v_roll_num >= 2320101 AND v_roll_num <= 2320200 THEN
        v_section := 'B';
      ELSE
        v_section := 'A'; -- Default
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_section := 'A'; -- Default on error
    END;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, student_id, department, section)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    v_role,
    v_student_id,
    NEW.raw_user_meta_data->>'department',
    v_section
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_section ON public.profiles(section);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON public.profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_lectures_teacher_id ON public.lectures(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lectures_section ON public.lectures(section);
CREATE INDEX IF NOT EXISTS idx_lectures_date ON public.lectures(lecture_date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_lecture_id ON public.attendance(lecture_id);
CREATE INDEX IF NOT EXISTS idx_od_requests_student_id ON public.od_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_od_requests_status ON public.od_requests(status);
