# 🔍 Test API Connection

## Step 1: Test the Connection

1. Make sure your dev server is running:
   ```bash
   npm run dev
   ```

2. Open your browser and go to:
   ```
   http://localhost:3000/api/test-connection
   ```

3. You'll see a JSON response. Copy it and check:

### Expected Response (If Working):
```json
{
  "auth": {
    "user": "some-uuid",
    "error": null
  },
  "attendance_sessions": {
    "accessible": true,
    "error": null,
    "data": []
  },
  "profiles": {
    "accessible": true,
    "error": null
  },
  "supabaseUrl": "https://xxxxx.supabase.co",
  "timestamp": "2024-..."
}
```

### If You See This Error:
```json
{
  "attendance_sessions": {
    "accessible": false,
    "error": "relation \"public.attendance_sessions\" does not exist"
  }
}
```
**This means:** Tables were NOT created in Supabase

### If You See This Error:
```json
{
  "attendance_sessions": {
    "accessible": false,
    "error": "Could not find the table 'public.attendance_sessions' in the schema cache"
  }
}
```
**This means:** Tables exist but PostgREST cache not refreshed

---

## Step 2: Based on the Response

### Scenario A: "relation does not exist"
**Tables are NOT in database**

1. Go to Supabase Dashboard
2. Open SQL Editor
3. Run this to verify:
   ```sql
   SELECT tablename FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename = 'attendance_sessions';
   ```
4. If returns 0 rows, run `CREATE-TABLES-SIMPLE.sql`

### Scenario B: "schema cache" error
**Tables exist, cache issue**

1. Supabase Dashboard → Settings → API
2. Click "Restart PostgREST"
3. Wait 2 minutes (not 60 seconds, wait longer!)
4. Test again

### Scenario C: Wrong Supabase URL
**Connected to wrong project**

Check if `supabaseUrl` in the response matches your Supabase project URL

---

## Step 3: Share Results

Copy the JSON response from `/api/test-connection` and share it so I can see exactly what's happening.

---

## Quick Debug Commands

### Check Environment Variables:
```bash
# In your terminal
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Check .env.local file exists:
```bash
# Windows
dir .env.local

# Should show the file
```

### Restart Everything:
```bash
# Stop dev server (Ctrl+C)
# Then:
npm run dev
```

---

**Go to http://localhost:3000/api/test-connection and share the response!**
