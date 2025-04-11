import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { serverConfig } from "../serverEnv";

const config = await serverConfig();

const client = postgres(config.db.url!);
export const db = drizzle({ client });
