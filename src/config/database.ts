import { PrismaClient } from '@prisma/client';

export let prisma: PrismaClient;

export const connectDb = async (): Promise<void> => {
    prisma = new PrismaClient();
};

export const disconnectDB = async (): Promise<void> => {
    await prisma?.$disconnect();
};
