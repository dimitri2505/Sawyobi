import { asc } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";

/**
 * Returns the active project. v1 supports a single project (სახლი #2);
 * additional projects can be added later without schema changes.
 */
export async function getActiveProject() {
  const rows = await db.select().from(projects).orderBy(asc(projects.id)).limit(1);
  return rows[0] ?? null;
}
