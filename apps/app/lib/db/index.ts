import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

// For query purposes
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

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
