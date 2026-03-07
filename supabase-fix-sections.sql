-- Fix sections for existing students based on their roll numbers

-- Check current state
SELECT 
  id,
  full_name,
  student_id,
  section,
  email
FROM public.profiles
WHERE role = 'student'
ORDER BY student_id;

-- Update sections based on roll number logic
-- Section A: 2320000-2320100
-- Section B: 2320101-2320200

UPDATE public.profiles
SET section = CASE
  WHEN CAST(student_id AS INTEGER) >= 2320000 AND CAST(student_id AS INTEGER) <= 2320100 THEN 'A'
  WHEN CAST(student_id AS INTEGER) >= 2320101 AND CAST(student_id AS INTEGER) <= 2320200 THEN 'B'
  ELSE 'A'
END
WHERE role = 'student' AND student_id IS NOT NULL;

-- Verify the update
SELECT 
  id,
  full_name,
  student_id,
  section,
  email
FROM public.profiles
WHERE role = 'student'
ORDER BY student_id;

-- Check section distribution
SELECT 
  section,
  COUNT(*) as student_count
FROM public.profiles
WHERE role = 'student'
GROUP BY section;
