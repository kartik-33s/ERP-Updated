# 🚀 QR Attendance Installation - Simple Steps

## ✅ What You Need to Do

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query** button

### Step 2: Run the Setup Script
1. Open the file: **`FINAL-QR-SETUP.sql`**
2. Copy **ALL** the content (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor (Ctrl+V)
4. Click **RUN** button (or press Ctrl+Enter)

### Step 3: Verify Success
You should see these messages at the bottom:
```
✅ SUCCESS! QR Attendance System Installed
Tables: attendance_sessions, attendance_logs
Functions: 5 functions created
Ready to use!
```

### Step 4: Test the System
1. Go to your app
2. Login as a teacher
3. Navigate to **Teacher → QR Attendance**
4. Click "Get Current Location"
5. Fill in the form:
   - Section: A or B
   - Subject: Any subject name
   - Date: Today's date
   - Lecture: Select any slot
   - Radius: 100 (default)
   - Duration: 15 (default)
6. Click **"Generate QR Code"**

### Expected Result
✅ A QR code should appear with an 8-character session code

---

## 🔍 If You Get Errors

### Error: "relation does not exist"
**Solution**: Make sure you copied the ENTIRE `FINAL-QR-SETUP.sql` file

### Error: "function already exists"
**Solution**: The script handles this automatically with DROP IF EXISTS

### Error: "permission denied"
**Solution**: Make sure you're logged into Supabase as the project owner

---

## 📊 What Gets Created

### Tables (2)
- `attendance_sessions` - Stores QR session data
- `attendance_logs` - Stores attendance attempts

### Functions (5)
- `calculate_distance()` - GPS distance calculation
- `create_qr_attendance_session()` - Creates new session
- `mark_qr_attendance()` - Marks student attendance
- `get_teacher_active_session()` - Gets active session
- `deactivate_session()` - Ends a session

### Security
- Row Level Security (RLS) enabled
- 6 security policies created
- Teacher/student access control

---

## ✅ Verification Checklist

After running the script, verify:
- [ ] No errors in SQL Editor
- [ ] Success messages displayed
- [ ] Tables visible in Table Editor
- [ ] Functions visible in Database → Functions
- [ ] Teacher can generate QR code
- [ ] QR code displays with session code

---

## 🎉 You're Done!

Once the script runs successfully:
- Teachers can generate QR codes
- Students can scan and mark attendance
- Location verification is active
- All logs are being recorded

**Need help?** Check the error message and refer to the troubleshooting section above.
