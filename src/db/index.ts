import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL environment variable is not set. Use a Neon URL (postgres://…) or 'pglite://./data/pgdata' for local in-process Postgres.",
  );
}

type NeonDb = ReturnType<typeof drizzleNeon<typeof schema>>;
type PgliteDb = ReturnType<typeof drizzlePglite<typeof schema>>;

declare global {
  // Cache across hot reloads in dev.
  var __sawyobi_db__:
    | { kind: "neon"; instance: NeonDb }
    | { kind: "pglite"; instance: PgliteDb; client: PGlite }
    | undefined;
}

function init() {
  if (globalThis.__sawyobi_db__) return globalThis.__sawyobi_db__;

  if (databaseUrl!.startsWith("pglite://")) {
    const dataDir = databaseUrl!.replace(/^pglite:\/\//, "");
    const client = new PGlite(dataDir);
    const instance = drizzlePglite(client, { schema });
    globalThis.__sawyobi_db__ = { kind: "pglite", instance, client };
    return globalThis.__sawyobi_db__;
  }

  const sql = neon(databaseUrl!);
  const instance = drizzleNeon(sql, { schema });
  globalThis.__sawyobi_db__ = { kind: "neon", instance };
  return globalThis.__sawyobi_db__;
}

// Export the underlying drizzle instance directly so chained query
// builders work. The two driver shapes are query-compatible for our usage.
export const db = init().instance as unknown as NeonDb & PgliteDb;
export const dbKind = init().kind;
export { schema };
