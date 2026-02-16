# ⚠️ VERCEL ENVIRONMENT VARIABLES SETUP

**Status:** Required for successful deployment  
**Updated:** February 17, 2026

---

## 🔴 CRITICAL: Database URL Must Be Set in Vercel

The error `The datasource.url property is required` occurs during build when `DATABASE_URL` is not available in Vercel's build environment.

### Why This Happens

Vercel **does NOT automatically load `.env` files** from your repository during build. Instead, it uses only:
- Environment variables set in **Vercel Project Settings**
- Secrets from Vercel's vault (if using secret management)

Your local `.env` and `.env.local` files are NOT uploaded to Vercel.

---

## ✅ Solution: Set Environment Variables in Vercel

### Step 1: Go to Vercel Project Settings

1. Open https://vercel.com
2. Select your **project** (operational-system)
3. Click **Settings** in the top menu
4. Click **Environment Variables** in the left sidebar

### Step 2: Add DATABASE_URL

| Field | Value |
|-------|-------|
| **Name** | `DATABASE_URL` |
| **Value** | `mysql://3t81WVyyGAXU2j7.root:2zh481NtahWHDDdK@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test?sslaccept=strict` |
| **Environments** | Select: Production, Preview, Development |

**Click "Save"**

### Step 3: Add BLOB_READ_WRITE_TOKEN

| Field | Value |
|-------|-------|
| **Name** | `BLOB_READ_WRITE_TOKEN` |
| **Value** | `vercel_blob_rw_RYwGlFJBgbImibnQ_R0QIgASmeGokwUksw3qDJpqqvCsGlI` |
| **Environments** | Select: Production, Preview, Development |

**Click "Save"**

---

## 📸 Visual Guide

```
Vercel Dashboard
    ↓
[Select Project: operational-system]
    ↓
Settings (top menu)
    ↓
Environment Variables (left sidebar)
    ↓
Add DATABASE_URL + BLOB_READ_WRITE_TOKEN
    ↓
Deploy
```

---

## 🚀 After Setting Environment Variables

1. **Redeploy your project:**
   ```
   Vercel Dashboard → Deployments → [Latest] → "Redeploy" button
   ```
   OR push new commit to GitHub:
   ```bash
   git commit --allow-empty -m "Trigger Vercel rebuild with env vars"
   git push origin main
   ```

2. **The build should now succeed** with:
   ```
   ✓ prisma generate
   ✓ prisma migrate deploy
   ✓ next build
   ```

---

## ❌ Common Issues & Fixes

### Issue: Still getting `datasource.url is required` error

**Cause:** Environment variables not saved properly

**Fix:**
1. Go back to Project Settings → Environment Variables
2. Verify both `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` are listed
3. Make sure you selected all environments (Production, Preview, Development)
4. Click "Save" for each variable

### Issue: Variables show but still failing

**Cause:** Vercel cache issue

**Fix:**
1. Go to Deployments
2. Find the failed deployment
3. Click the "..." menu
4. Click "Redeploy"
5. This will use the newly saved environment variables

### Issue: Don't know if environment variables are correctly set

**Fix:** Check the build logs:
1. Vercel Dashboard → Deployments → [Recent deploy]
2. Scroll to "Build" section
3. Look for this in Prisma output:
   ```
   Datasource "db": MySQL database "test" at "gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000"
   ```
   If you see this, DATABASE_URL is correctly loaded! ✅

---

## 🔐 Security Notes

### ⚠️ Important: Secrets in Repository

The `.env` and `.env.local` files contain actual database credentials. These should **NEVER** be committed to GitHub:

```bash
# Check if .env files are in gitignore
cat .gitignore | grep env
```

Should show:
```
.env
.env.local
```

✅ These files are already in `.gitignore`, so they won't be pushed to GitHub.

### 🔒 In Vercel, Secrets Are Safe

Vercel securely stores environment variables. They are:
- Encrypted at rest
- Only available during build time
- Never exposed in client-side code
- Available to team members with access

---

## ✅ Verification Checklist

After setting environment variables and redeploying:

- [ ] Vercel build is green (success)
- [ ] No "datasource.url is required" error
- [ ] Login page loads: https://your-app.vercel.app/login
- [ ] Database check works: https://your-app.vercel.app/api/reset
- [ ] Can see database status with users list

---

## 📝 Quick Reference

### Local Development (Uses .env.local)
```bash
npm run dev                    # Works with .env.local
npx prisma migrate status      # Works with .env.local
npx prisma studio            # Works with .env.local
```

### Production (Uses Vercel Environment Variables)
```bash
# Vercel automatically uses Environment Variables from project settings
# No .env files needed - everything comes from project settings
```

### Environment Variable Locations

| Environment | DATABASE_URL Source |
|-------------|-------------------|
| **Local Dev** | `.env.local` (git ignored) |
| **Vercel Preview** | Project Settings → Environment Variables |
| **Vercel Production** | Project Settings → Environment Variables |

---

## 📞 Need Help?

1. **Check Vercel Build Logs:**
   - Deployments → [Your deployment] → Logs
   - Look for Prisma connection details

2. **Verify DATABASE_URL Format:**
   - Must start with `mysql://`
   - Must include: `user:password@host:port/database`
   - Your format: `mysql://3t81WVyyGAXU2j7.root:2zh481NtahWHDDdK@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test?sslaccept=strict`

3. **Test Locally First:**
   ```bash
   # Make sure it works locally before deploying
   npx prisma migrate status
   npm run build
   npm start
   ```

---

## ✨ Success Indicators

When correctly configured, during Vercel build you'll see:

```
✓ prisma generate
  Loaded Prisma config from prisma.config.ts.
  Connecting to datasource db: MySQL database "test" at "..."
✓ prisma migrate deploy
  2 migrations found
  Database schema is up to date!
✓ next build
  Compiled successfully
```

This means DATABASE_URL is properly loaded and your deployment is ready! 🎉

---

**⏰ ACTION REQUIRED:** Set these environment variables in Vercel Project Settings before deploying, or redeploy after setting them.
