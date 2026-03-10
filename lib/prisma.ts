import { PrismaClient } from '@prisma/client';
import { connect } from '@tidbcloud/serverless';
import { PrismaTiDBCloud } from '@tidbcloud/prisma-adapter';

const prismaClientSingleton = () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('❌ DATABASE_URL tidak ditemukan! Pastikan sudah di-set di file .env');
  }

  const connection = connect({ url: databaseUrl });
  
  const adapter = new PrismaTiDBCloud(connection);

  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;