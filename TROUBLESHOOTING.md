# 🔧 QR Attendance Troubleshooting Guide

## Common Errors and Solutions

### 1. "Could not find the function public.create_qr_attendance_session"

**Cause**: Database functions not created

**Solution**:
1. Open `FINAL-QR-SETUP.sql`
2. Copy ENTIRE file
3. Run in Supabase SQL Editor
4. Wait for "SUCCESS" message

---

### 2. "relation 'public.profiles' does not exist"

**Cause**: Base tables missing from your database

**Solution**: Your database needs the base ERP tables first. Check if you have:
- `profiles` table
- `lectures` table  
- `attendance` table

If missing, you need to run your base ERP setup first.

---

### 3. "column 'session_code' does not exist"

**Cause**: Table creation failed or partial

**Solution**:
1. Run `FINAL-QR-SETUP.sql` (it drops and recreates tables)
2. This will clean up any partial installations
3. Creates fresh tables with all columns

---

### 4. QR Code Not Generating

**Symptoms**: Button click but no QR appears

**Checks**:
1. Open browser console (F12)
2. Look for error messages
3. Check Network tab for failed API calls

**Common Causes**:
- Database functions not created → Run `FINAL-QR-SETUP.sql`
- Not logged in as teacher → Check your role
- Location not obtained → Click "Get Current Location" first

---

### 5. Location Not Working

**Symptoms**: "Location access required" error

**Solutions**:
1. **Check HTTPS**: Geolocation requires HTTPS (except localhost)
2. **Browser Permissions**: Allow location access when prompted
3. **Device Settings**: Enable location services on your device
4. **Try Different Browser**: Chrome/Firefox work best

**Steps**:
- Chrome: Click lock icon → Site settings → Location → Allow
- Firefox: Click lock icon → Permissions → Location → Allow
- Safari: Safari → Preferences → Websites → Location

---

### 6. "Invalid or expired session"

**Cause**: Session expired or not active

**Solutions**:
- Teacher creates new session
- Check session duration (default 15 minutes)
- Verify current time is within session window

---

### 7. "Location verification failed"

**Cause**: Student too far from classroom

**Details**: Error shows actual distance vs required

**Solutions**:
- Student moves closer to classroom
- Teacher increases radius temporarily
- Check if teacher set location correctly
- Indoor GPS may be less accurate

---

### 8. Database Connection Errors

**Symptoms**: "Failed to connect" or timeout errors

**Checks**:
1. Verify environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```
2. Check Supabase project is active
3. Verify API keys are correct

---

### 9. RLS Policy Errors

**Symptoms**: "permission denied" or "row level security"

**Solution**:
1. Run `FINAL-QR-SETUP.sql` (includes RLS policies)
2. Verify user is authenticated
3. Check user role (teacher/student)

---

### 10. TypeScript Errors

**Symptoms**: Red underlines in code editor

**Solution**:
```bash
npm install qrcode @types/qrcode
```

Then restart your dev server.

---

## Debugging Steps

### Step 1: Verify Database Setup
```sql
-- Run in Supabase SQL Editor
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('attendance_sessions', 'attendance_logs');
```
Should return 2 rows.

### Step 2: Verify Functions
```sql
-- Run in Supabase SQL Editor
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%qr%';
```
Should return 3 functions.

### Step 3: Test Distance Function
```sql
-- Run in Supabase SQL Editor
SELECT calculate_distance(0, 0, 0, 0.001);
```
Should return a number (around 111 meters).

### Step 4: Check Browser Console
1. Open browser (F12)
2. Go to Console tab
3. Look for red error messages
4. Share error message for help

---

## Quick Fixes

### Reset Everything
If nothing works, start fresh:

```sql
-- Run in Supabase SQL Editor
DROP TABLE IF EXISTS public.attendance_logs CASCADE;
DROP TABLE IF EXISTS public.attendance_sessions CASCADE;
DROP FUNCTION IF EXISTS public.calculate_distance CASCADE;
DROP FUNCTION IF EXISTS public.create_qr_attendance_session CASCADE;
DROP FUNCTION IF EXISTS public.mark_qr_attendance CASCADE;
DROP FUNCTION IF EXISTS public.get_teacher_active_session CASCADE;
DROP FUNCTION IF EXISTS public.deactivate_session CASCADE;
```

Then run `FINAL-QR-SETUP.sql` again.

---

## Still Having Issues?

### Collect This Information:
1. Exact error message
2. Browser console errors (F12)
3. Which step failed
4. Your Supabase project region
5. Browser and version

### Check These:
- [ ] `FINAL-QR-SETUP.sql` ran successfully
- [ ] Success messages appeared
- [ ] Tables exist in Supabase
- [ ] Functions exist in Supabase
- [ ] Environment variables set
- [ ] HTTPS enabled (production)
- [ ] User logged in
- [ ] User has correct role

---

## Prevention Tips

### Before Deployment:
1. ✅ Run `FINAL-QR-SETUP.sql` completely
2. ✅ Verify success messages
3. ✅ Test with one teacher
4. ✅ Test with one student
5. ✅ Check logs are recording
6. ✅ Verify location works
7. ✅ Test session expiration

### Regular Maintenance:
- Review logs weekly
- Monitor error patterns
- Update radius as needed
- Archive old sessions monthly

---

## Success Indicators

System is working when:
- ✅ Teacher can generate QR codes
- ✅ QR code displays with 8-char code
- ✅ Student can enter code
- ✅ Location detected automatically
- ✅ Attendance marks successfully
- ✅ Logs show in database
- ✅ Distance calculated correctly

---

**Most issues are solved by running `FINAL-QR-SETUP.sql` completely!**
