// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  // Validasi keamanan sederhana
  if (!databaseUrl) {
    throw new Error('❌ DATABASE_URL tidak ditemukan! Pastikan sudah di-set di file .env');
  }

  // Menggunakan koneksi native Prisma (MySQL Protocol) yang sangat stabil
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;