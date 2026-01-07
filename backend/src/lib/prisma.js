import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma Client
// Prevents "too many clients" error in development with hot reload
const globalForPrisma = global;

export const prisma = globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
