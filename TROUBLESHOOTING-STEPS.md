# Troubleshooting Foreign Key Error

## Current Error
```
Error in create_lecture_with_attendance: insert or update on table "attendance" 
violates foreign key constraint "attendance_student_id_fkey" (SQLSTATE: 23503)
```

## This means:
The student IDs being sent don't exist in the `profiles` table.

## Step-by-Step Fix:

### Step 1: Check Browser Console
1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Try to mark attendance again
4. Look for these logs:
   - "Student IDs being sent: [...]"
   - "Existing students in DB: [...]"
   - "Missing student IDs: [...]"

### Step 2: Run Diagnostic Script in Supabase
1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of `supabase-diagnose-attendance-issue.sql`
5. Click "Run"
6. Check the results:
   - Do you have students in the profiles table?
   - What sections do they belong to?
   - Are there any orphaned records?

### Step 3: Run the Fix Script
1. In Supabase SQL Editor, create a new query
2. Copy and paste the contents of `supabase-fix-attendance-foreign-key.sql`
3. Click "Run"
4. You should see "Success. No rows returned"

### Step 4: Verify the Fix
1. Refresh your application page
2. Try marking attendance again
3. Check the browser console for detailed logs

## Common Causes:

### Cause 1: No Students in Database
**Solution:** You need to create student accounts first
- Go to the sign-up page
- Create student accounts with:
  - Role: Student
  - Student ID: 2320001-2320100 (for Section A)
  - Student ID: 2320101-2320200 (for Section B)

### Cause 2: Students Have Wrong Role
**Solution:** Check and fix student roles
```sql
-- Check student roles
SELECT id, email, full_name, role, section 
FROM public.profiles 
WHERE role = 'student';

-- If students have wrong role, fix it:
UPDATE public.profiles 
SET role = 'student' 
WHERE email IN ('student1@example.com', 'student2@example.com');
```

### Cause 3: Students Missing from Profiles Table
**Solution:** Check auth.users vs profiles
```sql
-- Check if users exist in auth but not in profiles
SELECT u.id, u.email, p.id as profile_id
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- If found, manually create profiles:
INSERT INTO public.profiles (id, email, full_name, role, student_id, section)
VALUES 
  ('user-uuid-here', 'student@example.com', 'Student Name', 'student', '2320001', 'A');
```

### Cause 4: Old RPC Function Still Running
**Solution:** The fix script updates the RPC function to skip invalid student IDs
- Make sure you ran `supabase-fix-attendance-foreign-key.sql`
- The new function will log warnings but won't fail

## Quick Test Query
Run this in Supabase SQL Editor to see your students:
```sql
SELECT 
  id,
  student_id,
  full_name,
  email,
  section,
  role
FROM public.profiles
WHERE role = 'student'
ORDER BY section, student_id;
```

## If Still Not Working:
1. Share the output from the diagnostic script
2. Share the browser console logs
3. Share the result of the quick test query above
