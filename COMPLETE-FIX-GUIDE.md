# 🔧 Complete Fix Guide - Schema Cache Error

## Error: "Could not find the table 'public.attendance_sessions' in the schema cache"

This is a **Supabase PostgREST cache issue**. Here's how to fix it completely.

---

## 🎯 Quick Fix (Do This First)

### Step 1: Run Diagnostic
1. Open **Supabase SQL Editor**
2. Copy and run: **`DIAGNOSE-ISSUE.sql`**
3. Check the results

### Step 2: Based on Results

**If diagnostic shows "❌ No tables found":**
→ Run `CREATE-TABLES-SIMPLE.sql` to create tables

**If diagnostic shows "✅ Both tables exist":**
→ It's a cache issue. Proceed to Step 3.

### Step 3: Restart PostgREST
1. Go to **Supabase Dashboard**
2. Click **Settings** (left sidebar)
3. Click **API**
4. Scroll to **PostgREST** section
5. Click **"Restart PostgREST"** button
6. Wait 60 seconds

### Step 4: Test
Try generating QR code again. It should work now!

---

## 📋 Detailed Steps

### Option A: Tables Don't Exist

If `DIAGNOSE-ISSUE.sql` shows tables are missing:

1. **Open SQL Editor**
2. **Copy `CREATE-TABLES-SIMPLE.sql`** (entire file)
3. **Paste and RUN**
4. **Wait for "SUCCESS!" message**
5. **Run `DIAGNOSE-ISSUE.sql` again** to verify
6. **Restart PostgREST** (Settings → API → Restart)
7. **Wait 60 seconds**
8. **Test app**

### Option B: Tables Exist (Cache Issue)

If `DIAGNOSE-ISSUE.sql` shows tables exist:

1. **Restart PostgREST**
   - Dashboard → Settings → API → Restart PostgREST
   
2. **Wait for restart** (60 seconds)

3. **Clear browser cache**
   - Ctrl+Shift+Delete
   - Clear cached data
   - Close browser
   - Reopen browser

4. **Restart dev server**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

5. **Test app**

---

## 🔍 Why This Happens

### The Cache System

```
Your Database (PostgreSQL)
    ↓
PostgREST (Auto-generates REST API)
    ↓
Schema Cache (Stores table info)
    ↓
Your App (Makes API calls)
```

When you create new tables:
1. ✅ Tables created in database
2. ❌ Cache not updated yet
3. ❌ App can't find tables

**Solution:** Restart PostgREST to refresh cache

---

## 🛠️ Alternative Solutions

### Solution 1: Wait for Auto-Refresh
PostgREST auto-refreshes every 2-3 minutes. Just wait and try again.

### Solution 2: Use Supabase CLI
```bash
supabase db reset
```

### Solution 3: Pause and Resume Project
1. Dashboard → Settings → General
2. Click "Pause Project"
3. Wait for pause
4. Click "Resume Project"
5. Wait for full startup (2-3 minutes)

---

## ✅ Verification Steps

### 1. Verify Tables Exist
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('attendance_sessions', 'attendance_logs');
```
**Expected:** 2 rows

### 2. Verify You Can Query Tables
```sql
SELECT COUNT(*) FROM attendance_sessions;
```
**Expected:** 0 (or any number, no error)

### 3. Verify RLS Policies
```sql
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public';
```
**Expected:** 6 policies

### 4. Verify Environment Variables
Check `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 5. Verify API Endpoint
Open browser console (F12) and check Network tab when generating QR:
- Should see POST to `/api/qr-session/create`
- Check response for actual error details

---

## 🚨 Common Mistakes

### Mistake 1: Not Running Complete SQL Script
**Problem:** Only ran part of the script
**Solution:** Copy ENTIRE `CREATE-TABLES-SIMPLE.sql` file

### Mistake 2: Wrong Supabase Project
**Problem:** Created tables in different project
**Solution:** Verify project URL matches `.env.local`

### Mistake 3: Not Waiting for Restart
**Problem:** Tested immediately after restart
**Solution:** Wait full 60 seconds after restart

### Mistake 4: Browser Cache
**Problem:** Old API responses cached
**Solution:** Hard refresh (Ctrl+Shift+R) or clear cache

### Mistake 5: Dev Server Not Restarted
**Problem:** Old code still running
**Solution:** Stop (Ctrl+C) and restart `npm run dev`

---

## 📊 Expected Timeline

| Action | Time |
|--------|------|
| Run SQL script | 2-3 seconds |
| Restart PostgREST | 30-60 seconds |
| Cache refresh | Immediate after restart |
| Total | ~2 minutes |

---

## 🎯 Success Checklist

- [ ] Ran `DIAGNOSE-ISSUE.sql` - all checks pass
- [ ] Tables exist in database
- [ ] Restarted PostgREST
- [ ] Waited 60 seconds
- [ ] Cleared browser cache
- [ ] Restarted dev server
- [ ] Tested QR generation
- [ ] QR code appears successfully

---

## 💡 Pro Tips

1. **Always run diagnostic first** - Saves time identifying the issue
2. **Restart PostgREST after any schema change** - Prevents cache issues
3. **Wait the full 60 seconds** - Don't rush the restart
4. **Check browser console** - Shows actual API errors
5. **Verify environment variables** - Common source of issues

---

## 🆘 Still Not Working?

If you've tried everything:

1. **Check Supabase Status**
   - Visit status.supabase.com
   - Check for ongoing incidents

2. **Check Project Status**
   - Dashboard → Should show "Active"
   - If "Paused", click "Resume"

3. **Check API Logs**
   - Dashboard → Logs → API Logs
   - Look for errors

4. **Try Different Browser**
   - Sometimes browser extensions interfere
   - Try incognito mode

5. **Check Network**
   - Make sure you can reach Supabase
   - Check firewall/VPN settings

---

## 📞 Getting Help

If still stuck, provide:
1. Output from `DIAGNOSE-ISSUE.sql`
2. Browser console errors (F12)
3. Network tab showing API call
4. Supabase project region
5. Node.js version

---

**TL;DR:**
1. Run `DIAGNOSE-ISSUE.sql`
2. If tables missing → Run `CREATE-TABLES-SIMPLE.sql`
3. Restart PostgREST (Settings → API → Restart)
4. Wait 60 seconds
5. Test app

**This will fix it!** 🚀
