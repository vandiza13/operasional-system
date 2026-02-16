// lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { PrismaTiDBCloud } from '@tidbcloud/prisma-adapter';

const prismaClientSingleton = () => {
  let databaseUrl = process.env.DATABASE_URL;
  
  // Validasi DATABASE_URL ada
  if (!databaseUrl) {
    throw new Error(
      '❌ DATABASE_URL tidak ditemukan!\n' +
      'Pastikan sudah di-set di file .env.local\n' +
      'Lihat FIX_DATABASE_URL.md untuk panduan lengkap.\n' +
      'Format: mysql://username:password@host:port/database'
    );
  }

  // Validasi DATABASE_URL lengkap (harus ada database name)
  if (!databaseUrl.includes('?') && databaseUrl.split('/').length < 4) {
    throw new Error(
      '❌ DATABASE_URL tidak lengkap atau salah format!\n' +
      `Current: ${databaseUrl.substring(0, 50)}...\n` +
      'Format yang benar: mysql://username:password@host:port/database_name\n' +
      'Lihat FIX_DATABASE_URL.md untuk panduan mendapatkan URL yang benar dari TiDB Cloud.'
    );
  }

  // TiDB Adapter expects HTTP URL, not MySQL URL
  // Convert mysql:// to http:// dan remove SSL parameters yang tidak perlu
  let httpUrl = databaseUrl
    .replace(/^mysql:\/\//, 'http://')
    .replace(/\?sslaccept=strict/, '')
    .replace(/\?tls=true/, '');
  
  console.log('✅ DATABASE_URL valid, converting to HTTP format...');
  console.log(`   Using: ${httpUrl.substring(0, 60)}...`);

  // 1. Buat adapter dengan HTTP URL untuk TiDB Serverless
  const adapter = new PrismaTiDBCloud({
    url: httpUrl,
    // KUNCI PENYELESAIANNYA: Bypass cache agresif Next.js
    fetch: (req, init) => {
      return fetch(req, {
        ...init,
        cache: 'no-store', 
      });
    }
  });

  // 2. Masukkan adapter ke constructor PrismaClient
  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;