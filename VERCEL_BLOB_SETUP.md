# Panduan Setup Vercel Blob

## Langkah-Langkah Setup

### 1. Buat Project di Vercel
- Push kode ke GitHub
- Import project ke Vercel (vercel.com)
- Hubungkan dengan repository GitHub Anda

### 2. Setup Vercel Blob Storage
```
Vercel Dashboard → Project Anda → Settings → Storage → Blob → Create Database
```

### 3. Dapatkan Token
```
Vercel Dashboard → Project Anda → Settings → Storage → Blob → Tokens → Create Token
```

Pilih token dengan akses:
- ✅ **read** - Baca file
- ✅ **write** - Tulis/upload file  
- ✅ **delete** - Hapus file (optional)
- ✅ **list** - List file (optional)

Scope: `*` (semua path di dalam blob storage)

### 4. Set Environment Variable

#### Development (.env.local)
```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx_token_xxxxxxx
```

#### Production (Vercel Dashboard)
```
Settings → Environment Variables → Add:
- Name: BLOB_READ_WRITE_TOKEN
- Value: [paste token dari step 3]
```

### 5. Format Token
Token yang benar harus dimulai dengan: `vercel_blob_rw_`

Contoh format lengkap:
```
vercel_blob_rw_131095_token_abcdef123456789
```

## Testing Vercel Blob

### Test di Development
```bash
npm run dev
# Coba upload file di form reimbursement
# Cek console untuk melihat URL dari Vercel Blob
```

### Verify Token Works
```bash
curl -X POST https://blob.vercel-storage.com/ \
  -H "Authorization: Bearer [YOUR_TOKEN]" \
  -F "file=@test.jpg"
```

## Troubleshooting

### Error: "This store does not exist"
**Solusi:**
1. Pastikan Vercel Blob sudah active di project
2. Verifikasi token benar dan masih valid
3. Token harus memiliki akses `read` & `write`
4. Pastikan token di-set di environment variable yang benar

### Error: "Invalid token"
**Solusi:**
1. Copy token lagi dari Vercel Dashboard
2. Pastikan tidak ada whitespace/spasi
3. Token harus dimulai dengan `vercel_blob_rw_`

### File tidak ter-upload tapi tidak error
**Solusi:**
1. Check quota Vercel Blob (max storage)
2. Verify file size tidak terlalu besar
3. Check network/connection ke Vercel

## Kapan Fallback ke Local Storage?

Sistem otomatis fallback ke local storage jika:
- ❌ `BLOB_READ_WRITE_TOKEN` tidak ada / kosong
- ❌ Token invalid atau expired
- ❌ Tidak ada koneksi ke Vercel

File akan tersimpan di `/public/receipts/` sebagai backup.

## Notes Production

Setelah deploy ke Vercel:
1. ✅ Vercel Blob akan menjadi pilihan utama
2. ✅ File disimpan di CDN Vercel (lebih cepat)
3. ✅ URL public dan bisa di-cache
4. ✅ Scalable dan reliable

Jika Vercel Blob bermasalah di production, fallback ke local storage masih bekerja.
