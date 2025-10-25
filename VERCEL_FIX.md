# 🔧 Fix Vercel Random 500 Errors

## Problem
Getting intermittent 500 errors on Vercel - page works sometimes, fails others. Need to reload 10+ times.

## Root Cause
**Database connection exhaustion** - Vercel serverless functions create new connections on each request, hitting Supabase connection limits.

---

## ✅ Complete Solution

### Step 1: Update Environment Variables

You need **TWO** database URLs:

#### 1. DATABASE_URL (Connection Pooler)
**For**: Runtime queries (app usage)  
**Get from**: Supabase → Settings → Database → Connection String → **Transaction** mode

```env
DATABASE_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

**Key points**:
- Port: `6543` (pooler)
- Host: `pooler.supabase.com`
- Query: `?pgbouncer=true&connection_limit=1`

#### 2. DIRECT_URL (Direct Connection)
**For**: Migrations only  
**Get from**: Supabase → Settings → Database → Connection String → **Session** mode

```env
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
```

**Key points**:
- Port: `5432` (direct)
- Host: `db.supabase.co`
- No pgbouncer parameter

### Step 2: Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add/Update these variables for **ALL environments** (Production, Preview, Development):

```
DATABASE_URL = postgresql://postgres.xxxxx:[PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

DIRECT_URL = postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### Step 3: Update Local .env

Add both URLs to your local `.env` file:

```env
# Connection Pooler (for app runtime)
DATABASE_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct Connection (for migrations)
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
```

### Step 4: Regenerate Prisma Client

```bash
npx prisma generate
```

### Step 5: Deploy

```bash
git add .
git commit -m "Fix database connection pooling for Vercel"
git push origin main
```

---

## 🔍 How to Get Your Connection Strings

### From Supabase Dashboard:

1. Go to your project: https://app.supabase.com
2. Click **Settings** (gear icon)
3. Click **Database**
4. Scroll to **Connection String** section

### For DATABASE_URL (Pooler):
- Select **Transaction** mode
- Copy the connection string
- Should have port `6543` and `pooler.supabase.com`

### For DIRECT_URL (Direct):
- Select **Session** mode  
- Copy the connection string
- Should have port `5432` and `db.supabase.co`

### Replace Password:
Both URLs will have `[YOUR-PASSWORD]` - replace with your actual database password

---

## ✅ Verification

After deploying, you should see:

### Before (Broken):
```
❌ 500 errors randomly
❌ "Can't reach database server"
❌ Works 1 out of 10 times
```

### After (Fixed):
```
✅ Consistent page loads
✅ No connection errors
✅ Works every time
```

---

## 🧪 Test It

1. Visit your Vercel deployment URL
2. Refresh 10 times rapidly
3. Should load successfully every time
4. Check Vercel logs - no database errors

---

## 📊 Why This Works

### Without Connection Pooling:
```
Request 1 → New DB Connection (1/6 used)
Request 2 → New DB Connection (2/6 used)
Request 3 → New DB Connection (3/6 used)
...
Request 7 → ❌ ERROR: Connection limit reached
```

### With Connection Pooling:
```
Request 1 → Pooler → Reuses connection
Request 2 → Pooler → Reuses connection
Request 3 → Pooler → Reuses connection
...
Request 100 → ✅ Still works!
```

---

## 🚨 Common Mistakes

### ❌ Wrong: Using direct connection for runtime
```env
DATABASE_URL="postgresql://...@db.xxx.supabase.co:5432/..."
```
**Problem**: Hits connection limits on Vercel

### ❌ Wrong: Using pooler for migrations
```env
DATABASE_URL="postgresql://...@pooler.supabase.com:6543/...?pgbouncer=true"
```
**Problem**: Migrations fail with pgbouncer

### ✅ Correct: Use both URLs
```env
DATABASE_URL="...pooler.supabase.com:6543...?pgbouncer=true&connection_limit=1"
DIRECT_URL="...db.supabase.co:5432..."
```
**Result**: Runtime uses pooler, migrations use direct

---

## 🔧 Additional Optimizations

### 1. Increase Supabase Connection Limit (Optional)

If still having issues:
1. Go to Supabase Dashboard
2. Settings → Database
3. Increase connection limit (default is 60)

### 2. Monitor Connections

Check active connections in Supabase:
```sql
SELECT count(*) FROM pg_stat_activity;
```

### 3. Enable Vercel Logs

Check for connection errors:
1. Vercel Dashboard → Your Project
2. Click on a deployment
3. View **Functions** logs
4. Look for Prisma errors

---

## 📝 Summary Checklist

- [ ] Get Transaction pooler URL from Supabase (port 6543)
- [ ] Get Session direct URL from Supabase (port 5432)
- [ ] Add both URLs to local `.env`
- [ ] Add both URLs to Vercel environment variables
- [ ] Run `npx prisma generate`
- [ ] Commit and push changes
- [ ] Test deployment (refresh 10 times)
- [ ] Verify no 500 errors

---

## 💡 Pro Tips

1. **Always use pooler URL** for production runtime
2. **Keep direct URL** for migrations and Prisma Studio
3. **Set connection_limit=1** in pooler URL for serverless
4. **Monitor Supabase metrics** for connection usage
5. **Check Vercel function logs** if issues persist

---

**After this fix, your Vercel deployment should be rock solid! 🎉**
