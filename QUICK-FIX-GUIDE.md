# Quick Fix Guide for Foreign Key Error

## The Problem
You're getting this error because the student IDs don't exist in the database.

## Immediate Actions (Do These in Order):

### 1. Open Browser Console (F12)
Look at the console when you try to mark attendance. You should see:
```
=== ATTENDANCE DEBUG ===
Student IDs being sent: [array of UUIDs]
Existing students in DB: [array of student objects]
```

**If "Existing students in DB" is empty or has fewer students than "Student IDs being sent":**
→ You don't have students in the database!

---

### 2. Check Database (Run in Supabase SQL Editor)
Copy and paste this query:
```sql
SELECT COUNT(*) as total_students
FROM public.profiles
WHERE role = 'student';
```

**If the result is 0:**
→ You need to create student accounts first!

---

### 3. Create Student Accounts
You have two options:

#### Option A: Use the Sign-Up Page
1. Go to `/auth/sign-up`
2. Create accounts with:
   - Full Name: Student Name
   - Email: student@example.com
   - Password: (any password)
   - Role: Student
   - Student ID: 2320001 (for Section A) or 2320101 (for Section B)
   - Department: Computer Science

#### Option B: Insert Directly in Database
Run this in Supabase SQL Editor:
```sql
-- First, create auth users (you'll need to do this via sign-up page)
-- Then insert profiles manually if needed:

INSERT INTO public.profiles (id, email, full_name, role, student_id, section, department)
VALUES 
  -- Replace 'uuid-here' with actual user IDs from auth.users
  ('uuid-here', 'student1@example.com', 'Student One', 'student', '2320001', 'A', 'Computer Science'),
  ('uuid-here', 'student2@example.com', 'Student Two', 'student', '2320002', 'A', 'Computer Science');
```

---

### 4. Update the RPC Function (IMPORTANT!)
Run this in Supabase SQL Editor:

Copy the entire contents of `supabase-fix-attendance-foreign-key.sql` and run it.

This updates the function to skip invalid student IDs instead of crashing.

---

### 5. Test Again
1. Refresh your browser
2. Select a section
3. Check the console - you should now see students
4. Mark attendance
5. It should work!

---

## Still Not Working?

### Check This Query:
```sql
-- See all your students
SELECT 
  id,
  student_id,
  full_name,
  section,
  role
FROM public.profiles
WHERE role = 'student'
ORDER BY section, student_id;
```

### Check Auth Users:
```sql
-- See if users exist in auth but not in profiles
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'role' as role,
  p.id as has_profile
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.raw_user_meta_data->>'role' = 'student';
```

If users exist in `auth.users` but not in `public.profiles`, the trigger might not have fired. You'll need to manually create the profiles.

---

## Expected Console Output (When Working):
```
=== ATTENDANCE DEBUG ===
Section: A
Subject: Mathematics
Teacher ID: abc-123-def
Lecture Date: 2024-01-15
Lecture Time: 09:15
Lecture Number: 1
Number of students: 5
Student IDs being sent: ["uuid1", "uuid2", "uuid3", "uuid4", "uuid5"]
Existing students in DB: [
  {id: "uuid1", student_id: "2320001", full_name: "Student 1"},
  {id: "uuid2", student_id: "2320002", full_name: "Student 2"},
  ...
]
Check error: null
```

If you see this, attendance marking should work!
