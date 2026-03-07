-- ========================================
-- FIX: Add missing UNIQUE constraint on attendance table
-- This fixes the error: "there is no unique or exclusion constraint 
-- matching the ON CONFLICT specification"
-- 
-- Run this in Supabase SQL Editor → Click "RUN"
-- ========================================

-- Step 1: Check if the unique constraint already exists
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'public.attendance'::regclass;

-- Step 2: Add the unique constraint (student_id, lecture_id)
-- This is required by the create_lecture_with_attendance RPC function
-- which uses ON CONFLICT (student_id, lecture_id)
ALTER TABLE public.attendance 
  DROP CONSTRAINT IF EXISTS attendance_student_id_lecture_id_key;

ALTER TABLE public.attendance 
  ADD CONSTRAINT attendance_student_id_lecture_id_key 
  UNIQUE (student_id, lecture_id);

-- Step 3: Also add a unique constraint for (student_id, date) 
-- This is used by the OD approval flow in approval-actions.tsx
-- Only add if your schema supports one attendance record per student per date
-- ALTER TABLE public.attendance 
--   ADD CONSTRAINT attendance_student_id_date_key 
--   UNIQUE (student_id, date);

-- Step 4: Verify the constraint was added
SELECT conname, contype, 
       pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.attendance'::regclass;

SELECT 'SUCCESS! Unique constraint added to attendance table.' as result;
