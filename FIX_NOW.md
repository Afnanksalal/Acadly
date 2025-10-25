# ⚡ Fix Vercel 500 Errors - Quick Action

## 🎯 What You Need to Do RIGHT NOW

### 1️⃣ Get Your Connection Strings (2 minutes)

Go to: https://app.supabase.com → Your Project → Settings → Database

#### Get DATABASE_URL (Transaction Pooler):
1. Find "Connection String" section
2. Select **Transaction** mode
3. Copy the string (should have `pooler.supabase.com` and port `6543`)
4. Replace `[YOUR-PASSWORD]` with your actual password

Example:
```
postgresql://postgres.mvbzzgivzvxgjnmlcanc:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

Add `&connection_limit=1` at the end:
```
postgresql://postgres.mvbzzgivzvxgjnmlcanc:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

#### Get DIRECT_URL (Session Mode):
1. Same section, select **Session** mode
2. Copy the string (should have `db.supabase.co` and port `5432`)
3. Replace `[YOUR-PASSWORD]` with your actual password

Example:
```
postgresql://postgres:[YOUR-PASSWORD]@db.mvbzzgivzvxgjnmlcanc.supabase.co:5432/postgres
```

---

### 2️⃣ Update Your Local .env (1 minute)

Open `.env` file and update/add these lines:

```env
# Replace your current DATABASE_URL with this:
DATABASE_URL="postgresql://postgres.mvbzzgivzvxgjnmlcanc:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Add this new line:
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.mvbzzgivzvxgjnmlcanc.supabase.co:5432/postgres"
```

**Important**: Replace `[YOUR-PASSWORD]` with your actual database password!

---

### 3️⃣ Update Vercel Environment Variables (2 minutes)

1. Go to: https://vercel.com/dashboard
2. Click your project
3. Go to **Settings** → **Environment Variables**
4. Find `DATABASE_URL` and click **Edit**
5. Replace with your new pooler URL (from step 1)
6. Click **Add New** and add:
   - Name: `DIRECT_URL`
   - Value: Your direct URL (from step 1)
   - Environments: Check ALL (Production, Preview, Development)
7. Click **Save**

---

### 4️⃣ Regenerate Prisma (30 seconds)

In your terminal:

```bash
npx prisma generate
```

---

### 5️⃣ Deploy (1 minute)

```bash
git add .
git commit -m "Fix database connection pooling"
git push origin main
```

---

## ✅ Done!

Wait for Vercel to deploy (2-3 minutes), then test your site. It should work consistently now!

---

## 🧪 Test

1. Open your Vercel URL
2. Refresh the page 10 times rapidly
3. Should load successfully every time ✅

---

## 🆘 Still Not Working?

Check:
- [ ] Both URLs have correct password (not `[YOUR-PASSWORD]`)
- [ ] DATABASE_URL has port `6543` and `pooler.supabase.com`
- [ ] DIRECT_URL has port `5432` and `db.supabase.co`
- [ ] Both variables added to Vercel
- [ ] Vercel deployment finished successfully

---

**Total Time: ~7 minutes**
