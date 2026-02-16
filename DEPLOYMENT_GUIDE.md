# 🚀 DEPLOYMENT GUIDE - Vercel

**Status:** ✅ Ready to Deploy  
**Last Updated:** February 17, 2026

---

## Quick Start (5 Minutes)

### 1️⃣ Push to GitHub
```powershell
cd c:\Users\Hp\operational-system
git add .
git commit -m "Audit complete: Ready for Vercel deployment"
git push origin main
```

### 2️⃣ Create Vercel Account (if needed)
- Go to https://vercel.com
- Sign up with GitHub
- Click "New Project" → Import Git Repository

### 3️⃣ Configure Environment Variables
In **Vercel Project Settings → Environment Variables**, add:

```
NAME: DATABASE_URL
VALUE: mysql://3t81WVyyGAXU2j7.root:2zh481NtahWHDDdK@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test?sslaccept=strict

NAME: BLOB_READ_WRITE_TOKEN
VALUE: vercel_blob_rw_RYwGlFJBgbImibnQ_R0QIgASmeGokwUksw3qDJpqqvCsGlI
```

### 4️⃣ Deploy 🎉
- Click "Deploy" button
- Wait for build to complete (~2 minutes)
- Visit your Vercel URL

---

## Verification Checklist

After deployment, verify everything works:

### ✅ Test Login Page
```
URL: https://your-app.vercel.app/login
Expected: Login form appears
```

### ✅ Check Database Connection
```
URL: https://your-app.vercel.app/api/reset
Expected: Database status JSON response
```

### ✅ Test Form Submission
1. Login with admin account
2. Navigate to `/submit`
3. Submit a test reimbursement claim
4. Check `/admin` page to see the claim

---

## Environment Variables Explained

### DATABASE_URL
**Database connection string for TiDB Cloud**
```
Format: mysql://username:password@host:port/database?sslaccept=strict
```
- ✅ Already configured in `.env.local`
- ✅ Will be loaded by Vercel automatically
- ✅ Prisma uses this to connect to database

### BLOB_READ_WRITE_TOKEN
**Vercel Blob storage token for file uploads**
```
Token format: vercel_blob_rw_XXXX...
```
- ✅ Used for uploading receipt images
- ✅ Falls back to local storage if not set
- ✅ Get from Vercel Dashboard → Storage → Blob

---

## Troubleshooting

### Issue: Build fails with Prisma error
**Solution:**
- Ensure `.env.local` exists with DATABASE_URL
- Check that `prisma.config.ts` is in root directory
- Run: `npm install && npx prisma generate`

### Issue: Database connection timeout
**Solution:**
- Verify DATABASE_URL is correct
- Check if TiDB Cloud is accessible from Vercel IP
- Test locally: `npm run dev`

### Issue: File upload fails
**Solution:**
- Check BLOB_READ_WRITE_TOKEN is set
- App falls back to local storage automatically
- Check `/public/receipts` folder has write permissions

### Issue: Middleware deprecation warning
**Solution:**
- This is expected in Next.js 16
- Doesn't affect functionality
- Can be fixed in future versions

---

## Post-Deployment

### 1. Test Admin Panel
```
URL: https://your-app.vercel.app/login
Login: admin@perusahaan.com / admin123
Feature: View reports, approve claims, mark as paid
```

### 2. Test Technician Portal
```
URL: https://your-app.vercel.app/login
Login: teknisi1@perusahaan.com / tech123
Feature: Submit expense claims with receipts
```

### 3. Monitor Logs
```
Vercel Dashboard → Deployments → [Latest] → Logs
Check for any runtime errors
```

### 4. Set Up Monitoring (Optional)
```
Vercel Dashboard → Settings → Analytics
Enable to track performance metrics
```

---

## Production Best Practices

### 🔐 Security
- ✅ Never share DATABASE_URL or BLOB_READ_WRITE_TOKEN
- ✅ Use Vercel secrets for sensitive data
- ✅ Enable branch protection on GitHub
- ✅ Review deployments before production

### 📊 Monitoring
- Set up error tracking (Sentry, LogRocket)
- Monitor database performance
- Check Vercel analytics dashboard

### 📈 Scaling
- TiDB Cloud auto-scales
- Vercel auto-scales serverless functions
- File uploads distributed via Vercel Blob

### 🔄 Updates
- Keep Next.js updated: `npm update next`
- Keep Prisma updated: `npm update @prisma/client`
- Review security advisories: `npm audit`

---

## Rollback (if needed)

If deployment has issues:

```
Vercel Dashboard → Deployments → [Previous] → "Redeploy" / "Promote to Production"
Or: Use GitHub to revert commit, auto-deploy with new push
```

---

## Support Resources

### Documentation
- Next.js: https://nextjs.org/docs
- Vercel: https://vercel.com/docs
- Prisma: https://www.prisma.io/docs
- TiDB: https://docs.tidbcloud.com

### Community
- Next.js Discord: https://discord.gg/nextjs
- Vercel Support: https://vercel.com/support
- GitHub Issues: Check project repository

---

## Deployment Checklist

- [ ] Repository pushed to GitHub
- [ ] Vercel account created
- [ ] GitHub repository connected to Vercel
- [ ] DATABASE_URL environment variable set
- [ ] BLOB_READ_WRITE_TOKEN environment variable set
- [ ] Build completed successfully
- [ ] Login page loads at your Vercel URL
- [ ] Database connection verified via `/api/reset`
- [ ] Test user can submit reimbursement
- [ ] Admin can view and approve claims

---

## Next Steps

After successful deployment:

1. **Configure Custom Domain** (optional)
   - Vercel Dashboard → Project Settings → Domains

2. **Set Up Analytics** (optional)
   - Vercel Dashboard → Projects → Analytics

3. **Add Team Members** (optional)
   - Vercel Dashboard → Project Settings → Collaborators

4. **Schedule Backups** (optional)
   - TiDB Cloud Dashboard → Backups

---

## Common Commands During Deployment

```powershell
# View build logs
vercel logs --prod

# Redeploy current version
vercel deploy --prod

# Check environment variables
vercel env list

# Set new environment variable
vercel env add DATABASE_URL
vercel env add BLOB_READ_WRITE_TOKEN

# Local testing before deploy
npm run build
npm run start

# Test Prisma schema
npx prisma validate
npx prisma migrate status
```

---

**Happy Deploying! 🎉**

Questions? Check AUDIT_REPORT.md for detailed technical information.
