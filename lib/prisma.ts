import { PrismaClient } from "@prisma/client";


const globalForPrisma = global as unknown as { prisma_v3: PrismaClient | undefined };

export const prisma =
    globalForPrisma.prisma_v3 ||
    new PrismaClient({
        log: ["query"]
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma_v3 = prisma;