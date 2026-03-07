# 🚨 RUN THIS FIRST! 🚨

## You're getting this error:
```
column "lecture_number" of relation "lectures" does not exist
```

## This means:
You haven't run the database migration yet!

---

## ✅ SOLUTION (Takes 1 minute):

### Step 1: Open Supabase
1. Go to your Supabase Dashboard
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Run the Migration
1. Open the file: `supabase-complete-migration.sql`
2. Copy ALL the contents (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click "Run" (or press Ctrl+Enter)

### Step 3: Verify Success
You should see:
```
✅ Migration completed successfully!
lecture_number column exists: true
RPC functions created: 3
```

### Step 4: Test
1. Go back to your app
2. Refresh the page (F5)
3. Try marking attendance again
4. It should work now! ✅

---

## What This Does:
- Adds `lecture_number` column to lectures table
- Creates the RPC function for saving attendance
- Creates helper functions for student attendance stats
- Adds proper error handling

---

## Still Getting Errors?

### If you get "No students found":
You need to create student accounts first:
1. Go to `/auth/sign-up`
2. Create students with:
   - Role: Student
   - Student ID: 2320001, 2320002, etc.
   - Section will be auto-assigned based on ID

### If you get other errors:
Check the browser console (F12) and share the error message.

---

## ⚠️ IMPORTANT:
Run `supabase-complete-migration.sql` ONLY ONCE!
It's safe to run multiple times, but you only need to run it once.
