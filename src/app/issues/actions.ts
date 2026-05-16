"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { issues, issueItems } from "@/db/schema";
import { getActiveProject } from "@/db/queries/project";

const ItemSchema = z.object({
  materialId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().positive(),
});

const HeaderSchema = z.object({
  segmentId: z.coerce.number().int().positive().optional().or(z.literal("")),
  issuedAt: z.string().trim().min(1),
  issuedBy: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export async function createIssue(formData: FormData) {
  const project = await getActiveProject();
  if (!project) throw new Error("აქტიური პროექტი არ არის. გაუშვი db:seed.");

  const header = HeaderSchema.parse({
    segmentId: formData.get("segmentId") ?? "",
    issuedAt: formData.get("issuedAt"),
    issuedBy: formData.get("issuedBy") ?? "",
    notes: formData.get("notes") ?? "",
  });

  const itemsJson = formData.get("items");
  if (typeof itemsJson !== "string")
    throw new Error("გატანის სტრიქონები არ მოიძებნა");
  const rawItems = JSON.parse(itemsJson) as unknown[];
  const items = rawItems
    .map((r) => {
      try {
        return ItemSchema.parse(r);
      } catch {
        return null;
      }
    })
    .filter((x): x is z.infer<typeof ItemSchema> => x !== null);

  if (items.length === 0)
    throw new Error("მინიმუმ ერთი მასალა საჭიროა");

  for (const it of items) {
    const result = await db.execute<{
      remaining: string;
      name: string;
      [key: string]: unknown;
    }>(
      sql`SELECT name, remaining::text AS remaining FROM v_stock WHERE material_id = ${it.materialId}`,
    );
    const rows = (result.rows ??
      (result as unknown as { remaining: string; name: string }[])) as {
      remaining: string;
      name: string;
    }[];
    const stock = rows[0];
    if (!stock) {
      throw new Error("არჩეული მასალა ვერ მოიძებნა საწყობში");
    }
    const remaining = Number(stock.remaining);
    if (remaining < it.quantity) {
      throw new Error(
        `"${stock.name}" — საწყობში არის მხოლოდ ${remaining}, მოთხოვნილია ${it.quantity}`,
      );
    }
  }

  const [issue] = await db
    .insert(issues)
    .values({
      projectId: project.id,
      segmentId:
        typeof header.segmentId === "number" ? header.segmentId : null,
      issuedAt: new Date(header.issuedAt),
      issuedBy: header.issuedBy || null,
      notes: header.notes || null,
    })
    .returning();

  await db.insert(issueItems).values(
    items.map((it) => ({
      issueId: issue.id,
      materialId: it.materialId,
      quantity: String(it.quantity),
    })),
  );

  revalidatePath("/issues");
  revalidatePath("/balance");
  revalidatePath("/");
  redirect(`/issues/${issue.id}`);
}

export async function deleteIssue(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  await db.delete(issues).where(eq(issues.id, id));
  revalidatePath("/issues");
  revalidatePath("/balance");
  revalidatePath("/");
}
