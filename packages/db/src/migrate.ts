import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { resolve } from "node:path";

config({ path: resolve(__dirname, "../../../.env") });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

async function runMigrations() {
  console.log("Running database migrations...");
  
  const client = postgres(url, { max: 1 });
  const db = drizzle(client);
  
  try {
    await migrate(db, { migrationsFolder: resolve(__dirname, "../drizzle") });
    console.log("✅ Migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
