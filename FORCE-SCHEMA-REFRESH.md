# 🔄 Force Supabase Schema Cache Refresh

## The Problem

Supabase's PostgREST layer caches the database schema. Even after creating tables, the cache may not update immediately, causing "table not found in schema cache" errors.

## ✅ Solution: Force Refresh

### Method 1: Restart PostgREST (Recommended)

1. Go to **Supabase Dashboard**
2. Click **Settings** (gear icon in left sidebar)
3. Click **API** section
4. Scroll down to **PostgREST**
5. Click **Restart PostgREST** button
6. Wait 30 seconds
7. Test your app again

### Method 2: Use Supabase CLI (If installed)

```bash
supabase db reset
```

### Method 3: Wait for Auto-Refresh

Supabase automatically refreshes the schema cache every few minutes. Just wait 2-3 minutes and try again.

### Method 4: Verify Tables Exist First

Before forcing refresh, make sure tables actually exist:

**Run this in Supabase SQL Editor:**
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('attendance_sessions', 'attendance_logs');
```

**Expected Result:** 2 rows showing both tables

**If you see 0 rows:** Tables weren't created. Run `CREATE-TABLES-SIMPLE.sql` again.

**If you see 2 rows:** Tables exist, just need cache refresh.

---

## 🎯 Step-by-Step Fix

### Step 1: Verify Tables Exist
Run the query above. If you see 2 rows, proceed to Step 2.

### Step 2: Restart PostgREST
- Dashboard → Settings → API → Restart PostgREST

### Step 3: Wait
Wait 30-60 seconds for the restart to complete.

### Step 4: Clear Browser Cache
- Press Ctrl+Shift+Delete
- Clear cached data
- Close and reopen browser

### Step 5: Test
Try generating QR code again.

---

## 🔍 Alternative: Check Your .env File

Make sure your environment variables are correct:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Verify:**
1. URL matches your Supabase project
2. Key is the "anon" key (not service_role)
3. No extra spaces or quotes
4. File is named `.env.local` (not `.env.txt`)

---

## 🆘 If Still Not Working

### Check Supabase Project Status

1. Go to Supabase Dashboard
2. Check if project shows "Active" (not "Paused")
3. If paused, click "Resume Project"
4. Wait for it to fully start

### Check API Settings

1. Dashboard → Settings → API
2. Verify "URL" and "anon public" key
3. Make sure they match your `.env.local` file

### Restart Your Dev Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

---

## 💡 Why This Happens

Supabase uses PostgREST to auto-generate REST APIs from your database schema. PostgREST caches the schema for performance. When you create new tables, the cache needs to be refreshed.

**Normal behavior:**
- Cache refreshes automatically every 2-3 minutes
- Or when PostgREST restarts
- Or when you manually trigger refresh

---

## ✅ Success Indicators

System is working when:
- No "schema cache" errors
- QR code generates successfully
- Tables visible in Table Editor
- API calls succeed

---

**TL;DR: Restart PostgREST in Supabase Dashboard → Settings → API → Restart PostgREST**
