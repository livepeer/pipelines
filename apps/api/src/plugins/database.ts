import fp from "fastify-plugin";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

declare module "fastify" {
  interface FastifyInstance {
    db: ReturnType<typeof drizzle<typeof schema>>;
  }
}

export default fp(async function (fastify) {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const queryClient = postgres(connectionString);
  const db = drizzle(queryClient, { schema });

  fastify.decorate("db", db);

  fastify.addHook("onClose", async () => {
    await queryClient.end();
  });
});
