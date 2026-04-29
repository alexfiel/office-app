import { PrismaClient } from "@prisma/client";


const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

// Force reload of Prisma Client to pick up the latest schema changes
globalForPrisma.prisma = undefined;

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ["query"]
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;