# 🔧 STEP-BY-STEP FIX FOR "lecture_number does not exist" ERROR

## The Problem
Your database doesn't have the `lecture_number` column yet. You MUST run the SQL migration.

---

## 📋 EXACT STEPS TO FIX:

### Step 1: Open Supabase
1. Go to https://supabase.com
2. Sign in to your account
3. Select your project

### Step 2: Open SQL Editor
1. Look at the left sidebar
2. Click on "SQL Editor" (it has a database icon)
3. Click the "+ New query" button at the top

### Step 3: Copy the SQL
1. Open the file `COPY-PASTE-THIS.sql` in your code editor
2. Select ALL the text (Ctrl+A or Cmd+A)
3. Copy it (Ctrl+C or Cmd+C)

### Step 4: Paste and Run
1. Go back to Supabase SQL Editor
2. Paste the SQL (Ctrl+V or Cmd+V)
3. Click the "Run" button (or press Ctrl+Enter)

### Step 5: Check for Success
You should see at the bottom:
```
SUCCESS! Column added and functions created.
```

If you see this, you're done! ✅

### Step 6: Test Your App
1. Go back to your application
2. Press F5 to refresh the page
3. Try marking attendance
4. It should work now!

---

## ⚠️ IMPORTANT NOTES:

### If you see "column already exists" error:
That's OK! It means the column was already added. The function will still be created.

### If you see "permission denied":
Make sure you're logged in as the project owner in Supabase.

### If you see "syntax error":
Make sure you copied the ENTIRE file, from the first line to the last line.

---

## 🆘 STILL NOT WORKING?

### Check if the column was actually added:
Run this query in Supabase SQL Editor:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'lectures' 
AND column_name = 'lecture_number';
```

**If it returns a row:** Column exists ✅
**If it returns nothing:** Column was NOT added ❌

### Check if the function exists:
Run this query:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'create_lecture_with_attendance';
```

**If it returns a row:** Function exists ✅
**If it returns nothing:** Function was NOT created ❌

---

## 📸 Visual Guide:

```
Supabase Dashboard
├── Left Sidebar
│   ├── Table Editor
│   ├── SQL Editor  ← CLICK HERE
│   ├── Database
│   └── ...
│
└── SQL Editor Page
    ├── + New query  ← CLICK HERE
    ├── [Paste SQL here]
    └── Run button  ← CLICK HERE
```

---

## ✅ After Running the Script:

Your database will have:
- ✅ `lecture_number` column in lectures table
- ✅ `create_lecture_with_attendance` function
- ✅ `get_student_lecture_stats` function
- ✅ Proper indexes for performance

Then your attendance system will work with all 8 lecture slots!
