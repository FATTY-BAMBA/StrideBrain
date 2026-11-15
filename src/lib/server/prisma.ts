import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../../../.generated/prisma/client";

const globalPrisma = globalThis as typeof globalThis & {
  __stridebrainPrisma?: PrismaClient;
};

function connectionString(): string {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error("DATABASE_URL is required for the StrideBrain server runtime.");
  }
  return value;
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: connectionString() });
  return new PrismaClient({ adapter });
}

/**
 * Lazily creates the server-only Prisma client. Keeping construction behind a
 * function prevents build-time module evaluation from opening a database
 * connection and preserves one pool across development hot reloads.
 */
export function getPrismaClient(): PrismaClient {
  if (!globalPrisma.__stridebrainPrisma) {
    globalPrisma.__stridebrainPrisma = createPrismaClient();
  }
  return globalPrisma.__stridebrainPrisma;
}

export async function disconnectPrismaClientForTests(): Promise<void> {
  const client = globalPrisma.__stridebrainPrisma;
  globalPrisma.__stridebrainPrisma = undefined;
  if (client) await client.$disconnect();
}
