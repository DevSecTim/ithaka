import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;

// Allow build without database (Next.js static analysis)
const client = url
  ? postgres(url, { max: 10 })
  : postgres("postgres://localhost:5432/dummy", { max: 1 });

export const db = drizzle(client, { schema });
export type Database = typeof db;
