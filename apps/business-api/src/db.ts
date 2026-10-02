import { PrismaClient } from '@prisma/client';

// Single shared Prisma client. Tests may import and $disconnect it.
export const prisma = new PrismaClient({
  log: process.env.PRISMA_LOG === '1' ? ['query', 'warn', 'error'] : ['warn', 'error'],
});
