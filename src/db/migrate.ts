import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  console.log(`Running migrations against ${url.split("@").pop()}…`);

  if (url.startsWith("pglite://")) {
    const dataDir = url.replace(/^pglite:\/\//, "");
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    const client = new PGlite(dataDir);
    const db = drizzle(client);
    await migrate(db, { migrationsFolder: "./drizzle" });
    await client.close();
  } else {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    const { migrate } = await import("drizzle-orm/neon-http/migrator");
    const sql = neon(url);
    const db = drizzle(sql);
    await migrate(db, { migrationsFolder: "./drizzle" });
  }

  console.log("Migrations applied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
