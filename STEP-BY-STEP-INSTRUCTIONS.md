# 📝 Step-by-Step Instructions - QR Attendance Setup

## ⚠️ IMPORTANT: Follow These Steps EXACTLY

### Step 1: Open Supabase SQL Editor

1. Go to your **Supabase Dashboard** (https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in the left sidebar (looks like a document icon)
4. Click **New Query** button (top right)

### Step 2: Copy the SQL Script

1. Open the file: **`CREATE-TABLES-SIMPLE.sql`** in your code editor
2. Press **Ctrl+A** (Select All)
3. Press **Ctrl+C** (Copy)

### Step 3: Paste in Supabase

1. Click in the SQL Editor text area
2. Press **Ctrl+V** (Paste)
3. You should see the entire script

### Step 4: Run the Script

1. Click the **RUN** button (or press **Ctrl+Enter**)
2. Wait for execution (should take 2-3 seconds)
3. Look at the bottom panel for results

### Step 5: Verify Success

You should see at the bottom:
```
status
-------
SUCCESS!
```

If you see any **RED ERROR** messages, copy the error and let me know.

### Step 6: Verify Tables Were Created

Run this query in a new SQL Editor tab:

```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('attendance_sessions', 'attendance_logs');
```

You should see **2 rows**:
- attendance_sessions
- attendance_logs

### Step 7: Test Your App

1. Go to your application
2. Login as a teacher
3. Navigate to **Teacher → QR Attendance**
4. Click "Get Current Location"
5. Fill in the form
6. Click "Generate QR Code"

---

## 🔍 If You Get Errors

### Error: "syntax error at or near..."
**Cause**: Script wasn't copied completely
**Solution**: Make sure you copied the ENTIRE file from top to bottom

### Error: "permission denied"
**Cause**: Not logged in as project owner
**Solution**: Make sure you're logged into Supabase as the project owner

### Error: "relation already exists"
**Cause**: Tables already exist (partial installation)
**Solution**: The script handles this with DROP TABLE IF EXISTS

### Error: Still says "table not found in schema cache"
**Cause**: Supabase hasn't refreshed its cache yet
**Solution**: 
1. Wait 30 seconds
2. Refresh your browser (F5)
3. Try again

---

## 📊 What Gets Created

### Tables (2):
1. **attendance_sessions** - Stores QR session data
2. **attendance_logs** - Stores attendance attempts

### Indexes (3):
- Fast lookup by session code
- Fast lookup by teacher
- Fast lookup by session for logs

### Security Policies (6):
- Teachers can view their own sessions
- Teachers can create sessions
- Teachers can update their sessions
- Students can view their own logs
- Teachers can view logs for their sessions
- Students can create logs

---

## ✅ Verification Checklist

After running the script:

- [ ] No red error messages in SQL Editor
- [ ] "SUCCESS!" message appears
- [ ] Tables visible in Table Editor
- [ ] Can navigate to QR Attendance page
- [ ] No errors in browser console (F12)

---

## 🆘 Still Having Issues?

### Try This:

1. **Check your Supabase project is active**
   - Go to Supabase Dashboard
   - Make sure project shows "Active" status

2. **Check you're in the right project**
   - Verify project name at top of dashboard
   - Make sure it matches your .env file

3. **Check environment variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
   ```

4. **Restart your dev server**
   ```bash
   # Stop the server (Ctrl+C)
   # Start again
   npm run dev
   ```

5. **Clear browser cache**
   - Press Ctrl+Shift+Delete
   - Clear cached images and files
   - Refresh page (F5)

---

## 📞 Need More Help?

If you're still getting errors:

1. Run `CHECK-TABLES.sql` to see what tables exist
2. Copy the exact error message
3. Check browser console (F12) for JavaScript errors
4. Share the error details

---

**Most issues are solved by:**
1. Copying the ENTIRE SQL script
2. Running it completely
3. Waiting 30 seconds for cache refresh
4. Refreshing browser

Good luck! 🚀
