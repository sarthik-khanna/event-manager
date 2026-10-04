import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string.");
  return drizzle(neon(url), { schema });
}

type Db = ReturnType<typeof createDb>;

const globalForDb = globalThis as unknown as { db?: Db };

// Lazily create the client so `next build` works without a DATABASE_URL.
export function getDb(): Db {
  if (!globalForDb.db) globalForDb.db = createDb();
  return globalForDb.db;
}

export { schema };
