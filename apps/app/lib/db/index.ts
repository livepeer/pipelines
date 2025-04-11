"use server";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
// import * as schema from "./schema";
import { serverConfig } from "../serverEnv";

const config = await serverConfig();

const client = postgres(config.db.url!);
export const db = drizzle({ client });

console.log(db);
