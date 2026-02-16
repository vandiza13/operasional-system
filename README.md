# 📋 Operational System - Complete Setup & Usage Guide

**Updated: February 16, 2026** | v1.0.0 - Production Ready

Aplikasi Next.js untuk manajemen pengguna dan proses reimbursement dengan fitur autentikasi, upload file, dan dashboard approval.

## 🎯 Fitur Utama

- ✅ Sistem autentikasi user (Admin & Technician) dengan bcrypt
- ✅ Form pengajuan reimbursement dengan upload multiple files
- ✅ Upload file ke Vercel Blob (fallback local storage)
- ✅ Dashboard admin untuk approval & payment tracking
- ✅ Database TiDB Cloud MySQL dengan Prisma ORM
- ✅ Route protection dengan middleware
- ✅ Tailwind CSS styling

## 🚀 Quick Start (3 Steps)

### 1. Install & Setup
```bash
npm install
cp .env.example .env.local  # Edit dengan credentials Anda
npx prisma generate
npx prisma db push
npm run dev
```

### 2. Create Test Users
Visit: `http://localhost:3000/api/seed`

### 3. Login & Test
- Admin: `admin@operational.com` / `admin123`
- Tech: `budi@teknisi.com` / `pass123`

---

## 📚 Detailed Setup

### Environment Variables
Edit `.env.local`:
```env
# TiDB Cloud - Format: http://user:pass@host:4000/database
DATABASE_URL="http://username:password@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test"

# Vercel Blob (Optional - fallback to local storage)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxx_token_xxxxx"
```

**Getting DATABASE_URL:**
1. [TiDB Cloud Dashboard](https://tidbcloud.com) → Select Cluster
2. Click "Connect" → Copy MySQL URL
3. Convert: `mysql://` → `http://`, remove `?sslaccept=strict`

### Prisma Sync
```bash
# If database schema doesn't match client:
npx prisma generate
npx prisma db push
```

---

## 🔐 Authentication

### Test Accounts (Default)

| Role | Email | Password |
|------|-------|----------|
| ADMIN | admin@operational.com | admin123 |
| TECH | budi@teknisi.com | pass123 |
| TECH | rina@teknisi.com | pass123 |

**Password Hashing:** bcrypt (10 salt rounds)

### Create Test Users
```bash
# API endpoint
GET http://localhost:3000/api/seed

# Browser Console
fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'reset' })
}).then(r => r.json()).then(console.log)
```

---

## 📝 Usage

### Technician Flow
1. **Login** → `/submit` route
2. **Fill Form:**
   - Jumlah (Rp)
   - Deskripsi
   - Foto Bon (required)
   - Foto Evidence 1-3 (optional)
3. **Submit** → Saves to database + Vercel Blob
4. **Status:** PENDING (tunggu admin approval)

### Admin Flow
1. **Login** → `/admin` route
2. **View** Submissions list
3. **Approve/Reject** Each item
4. **Mark Paid** When transferred
5. **Track** Status: PENDING → APPROVED → PAID

---

## 🗑️ Database Management

### Check Status
```
GET http://localhost:3000/api/reset
```

### Wipe All Data (DESTRUCTIVE)
```javascript
// Browser Console
fetch('/api/reset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ confirm: 'WIPE_ALL_DATA' })
}).then(r => r.json()).then(console.log)
```

Or visit UI: `http://localhost:3000/admin/reset`

---

## 🆘 Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| "Email/password salah" | No users in DB | Visit `/api/seed` |
| Vercel Blob error | Token invalid/missing | Check `.env.local` BLOB token |
| Database connection failed | Invalid URL format | Convert `mysql://` → `http://`, remove SSL params |
| Upload not working | Both methods failed | Check `/public/receipts` folder created |
| Type errors after schema change | Prisma client out of sync | Run `npx prisma generate` |

---

## 📁 Project Structure

```
app/
├── actions/               # Server Actions (business logic)
│   ├── auth.ts           # Login/Logout with bcrypt
│   ├── reimbursement.ts  # Submit form, file upload
│   ├── admin.ts          # Approve/Reject/Pay
│   └── seed.ts           # Create test users
├── api/                  # API Routes
│   ├── reset/route.ts    # Wipe database
│   ├── seed/route.ts     # Seed users
│   └── users/route.ts    # List/reset users
├── admin/                # Admin pages
│   ├── page.tsx          # Dashboard
│   └── reset/page.tsx    # DB reset UI
├── login/page.tsx        # Login form
├── submit/page.tsx       # Reimbursement form
└── page.tsx              # Home

lib/prisma.ts            # Prisma client + TiDB config
middleware.ts            # Auth & route protection
```

---

## 🔌 API Endpoints

| Route | Method | Body | Purpose |
|-------|--------|------|---------|
| `/api/seed` | GET | - | Create default test users |
| `/api/reset` | GET | - | Check DB status |
| `/api/reset` | POST | `{confirm:"WIPE_ALL_DATA"}` | Delete all data |
| `/api/users` | GET | - | List users |
| `/api/users` | POST | `{action:"reset"}` | Reset & reseed |

---

## 🛠️ Scripts

```bash
npm run dev      # Development server
npm run build    # Build for production
npm start        # Production server
npm run lint     # ESLint check
```

---

## ⚙️ Tech Stack

- **Framework:** Next.js 16
- **Runtime:** Node.js
- **Database:** TiDB Cloud (MySQL)
- **ORM:** Prisma
- **Auth:** Cookies + bcrypt
- **Upload:** Vercel Blob + Local FS
- **UI:** Tailwind CSS
- **Language:** TypeScript
- **Type Safety:** TypeScript strict mode

---

## 📌 Important Notes

### Security
- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ Session cookies httpOnly
- ✅ Route protection middleware
- ✅ Never commit `.env.local`

### Database
- No automatic backups
- Reset = permanent data loss
- TiDB managed by cloud provider

### File Storage
- Production: Vercel Blob (recommended)
- Development: Local `/public` folder
- Files auto-organized: `receipts/`, `evidences/`

### Deployment
- Deploy to Vercel (+ enable Blob storage)
- Set env vars in Vercel Dashboard
- Prisma migrations: `npx prisma db push`

---

## 📖 Documentation Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma ORM](https://www.prisma.io/docs)
- [TiDB Cloud](https://docs.pingcap.com/tidbcloud)
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- [bcrypt.js](https://github.com/dcodeIO/bcrypt.js)

---

## 🔄 Recent Updates (v1.0.0)

- ✅ Removed duplicate routes
- ✅ Standardized bcrypt password hashing  
- ✅ Fixed async/await issues
- ✅ Consolidated documentation
- ✅ Enhanced error handling
- ✅ Improved code organization

---

**Ready for production! 🚀**


## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
