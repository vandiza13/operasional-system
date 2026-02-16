// lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { PrismaTiDBCloud } from '@tidbcloud/prisma-adapter';

const prismaClientSingleton = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL belum di-set di file .env");
  }

  // 1. Bersihkan URL untuk jalur Serverless HTTP (HTTPS / Port 443)
  const serverlessUrl = process.env.DATABASE_URL
    .replace(':4000', '')
    .replace('?sslaccept=strict', '')
    .replace('?tls=true', '');

  // 2. Buat adapter dengan TiDB Serverless
  const adapter = new PrismaTiDBCloud({
    url: serverlessUrl,
    // INI KUNCI PENYELESAIANNYA: Bypass cache agresif Next.js
    fetch: (req, init) => {
      return fetch(req, {
        ...init,
        cache: 'no-store', // Memaksa Next.js membiarkan fetch ini lewat ke database
      });
    }
  });

  // 4. Masukkan adapter ke constructor PrismaClient
  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;