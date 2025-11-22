import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

// Validate DATABASE_URL before creating PrismaClient
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is not set. ' +
    'Please set it in your environment variables or .env file.'
  );
}

export const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pooling and timeout settings
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Handle connection errors gracefully
prisma.$on('error', (e) => {
  console.error('Prisma error:', e);
});

// Add connection health check
export async function checkDatabaseConnection() {
  try {
    const dbUrl = process.env.DATABASE_URL || '';
    const directUrl = process.env.DIRECT_URL || '';
    console.log('Checking database connection...');
    console.log('DATABASE_URL:', dbUrl.replace(/:[^:@]*@/, ':****@'));
    console.log('DIRECT_URL:', directUrl.replace(/:[^:@]*@/, ':****@'));

    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection successful!');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
