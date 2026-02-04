import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool, neonConfig } from '@neondatabase/serverless';

// Configurar WebSocket para ambientes que precisam (opcional em serverless)
// neonConfig.webSocketConstructor = ws; // Não necessário no Vercel

// Previne multiplas instancias do Prisma Client em desenvolvimento
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL não está configurada');
  }

  // Usar pool de conexões com Neon serverless
  const pool = globalForPrisma.pool ?? new Pool({
    connectionString,
    max: 5, // Limitar conexões em serverless
  });

  globalForPrisma.pool = pool;

  const adapter = new PrismaNeon(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
