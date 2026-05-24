# 504 Gateway Timeout Error - Troubleshooting Guide

## What is a 504 Error?
A 504 Gateway Timeout means the server (Supabase) is taking too long to respond (usually >30 seconds).

## Common Causes in Your App

### 1. Supabase Database Issues
- Database is paused (free tier auto-pauses after inactivity)
- Too many connections
- Slow queries due to missing indexes
- RLS policies causing performance issues

### 2. Middleware Performance
Your middleware runs on EVERY page load and:
- Calls `supabase.auth.getUser()` 
- Queries the `profiles` table
- This can timeout if database is slow

## Quick Fixes

### Fix 1: Check if Supabase is Paused
1. Go to https://supabase.com/dashboard
2. Select your project
3. If you see "Project is paused", click "Restore project"
4. Wait 2-3 minutes for it to wake up

### Fix 2: Restart PostgREST
1. Go to Supabase Dashboard
2. Settings → API
3. Click "Restart PostgREST"
4. Wait 3 minutes

### Fix 3: Check Database Connection
Visit: `http://localhost:3000/api/test-connection`

If this times out, your Supabase database is not responding.

### Fix 4: Optimize Middleware (Temporary)
Add timeout handling to prevent long waits.

### Fix 5: Check Browser Console
1. Open browser (F12)
2. Go to Network tab
3. Reload page
4. Look for which request is timing out
5. Check if it's:
   - The page itself (middleware issue)
   - An API call (backend issue)
   - A Supabase call (database issue)

## Diagnostic Steps

### Step 1: Test Supabase Connection
```bash
curl https://vmgtgmlkfwrlqvkozwpm.supabase.co/rest/v1/
```

Should return quickly. If it times out, Supabase is down/paused.

### Step 2: Check Which Page is Timing Out
- Does homepage load? `http://localhost:3000`
- Does login page load? `http://localhost:3000/auth/login`
- Does API work? `http://localhost:3000/api/test-connection`

### Step 3: Check Supabase Logs
1. Supabase Dashboard → Logs
2. Look for slow queries or errors

### Step 4: Disable Middleware Temporarily
Comment out the profile query in middleware to see if that's the issue.

## Solutions

### Solution 1: Add Timeout to Middleware
Prevent middleware from hanging forever.

### Solution 2: Cache Profile Data
Don't query profiles table on every request.

### Solution 3: Upgrade Supabase Plan
Free tier has limitations and auto-pauses.

### Solution 4: Add Indexes
Ensure profiles table has proper indexes.

## Most Likely Cause
**Supabase project is paused (free tier)**

Go to dashboard and restore it!

## Next Steps
1. Check if Supabase is paused
2. Restart PostgREST
3. Test with browser console open
4. Report which specific request is timing out
