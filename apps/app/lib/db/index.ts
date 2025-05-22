import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

export type Database = typeof db;
export type Schema = typeof schema;

// For transactions or one-time queries that need to be cleaned up
export const getDbClient = () => {
  const client = postgres(connectionString);
  return drizzle(client, { schema });
};

// Helper for running with a client then closing connection
export const withDbClient = async <T>(
  fn: (db: ReturnType<typeof drizzle<typeof schema>>) => Promise<T>,
): Promise<T> => {
  const client = postgres(connectionString);
  const db = drizzle(client, { schema });
  try {
    return await fn(db);
  } finally {
    await client.end();
  }
};
