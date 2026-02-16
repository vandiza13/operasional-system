# Operational System - Sistem Manajemen Pengguna dan Reimbursement

Aplikasi Next.js untuk mengelola pengguna dan proses reimbursement dengan upload bukti struk.

## 🎯 Fitur Utama

- ✅ Sistem autentikasi user (Admin & Technician)
- ✅ Form pengajuan reimbursement dengan upload bukti
- ✅ Upload file ke Vercel Blob (dengan fallback local storage)
- ✅ Dashboard admin untuk melihat reimbursement
- ✅ Database TiDB Cloud MySQL
- ✅ Tailwind CSS untuk styling

## 🚀 Setup & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
Copy dan isi file `.env.local`:
```bash
cp .env.example .env.local
```

**Required Variables:**
```env
# Database TiDB Cloud
DATABASE_URL="mysql://..."

# Vercel Blob (optional, fallback ke local storage jika tidak ada)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

**Lihat:** [VERCEL_BLOB_SETUP.md](./VERCEL_BLOB_SETUP.md) untuk petunjuk lengkap.

### 3. Setup Database
```bash
npx prisma migrate dev
# atau
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📋 Struktur Project

```
app/
├── actions/           # Server actions
│   ├── reimbursement.ts   # Upload & save reimbursement
│   ├── admin.ts           # Admin actions
│   └── vercel-blob-test.ts # Testing tool
├── admin/            # Admin pages
├── submit/           # Submit reimbursement form
└── page.tsx          # Home page

lib/
└── prisma.ts         # Prisma client setup (TiDB)

prisma/
└── schema.prisma     # Database schema
```

## 🛠 Troubleshooting

### Upload File Error

**Error: "Vercel Blob: This store does not exist"**

Solusi:
1. Pastikan `BLOB_READ_WRITE_TOKEN` di `.env.local`
2. Verify token di Vercel Dashboard
3. Check token format: `vercel_blob_rw_xxxxx_token_xxxxx`
4. Jika fallback, file akan disimpan di `/public/receipts/`

Lihat [VERCEL_BLOB_SETUP.md](./VERCEL_BLOB_SETUP.md) untuk detail.

### Database Connection Error

**Error: "DATABASE_URL belum di-set"**

Solusi:
1. Pastikan `DATABASE_URL` di `.env.local`
2. Check TiDB Cloud credentials
3. Jalankan `npx prisma db push` untuk setup schema

## 📚 Dokumentasi

- [Vercel Blob Setup Guide](./VERCEL_BLOB_SETUP.md) - Panduan lengkap setup file storage
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [TiDB Cloud Docs](https://docs.pingcap.com/tidbcloud)

## 🚢 Deployment

### Deploy ke Vercel

1. Push code ke GitHub
2. Import di Vercel Dashboard
3. Set environment variables di `Settings > Environment Variables`
4. Deploy!

**Note:** Vercel Blob otomatis tersedia di production.

## 📝 Scripts

```bash
npm run dev      # Development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Jalankan ESLint
```

## 📄 License

MIT


## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
