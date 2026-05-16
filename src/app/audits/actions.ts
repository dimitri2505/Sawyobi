"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { audits, auditItems } from "@/db/schema";
import { getActiveProject } from "@/db/queries/project";

const ItemSchema = z.object({
  materialId: z.coerce.number().int().positive(),
  countedQuantity: z.coerce.number().min(0),
  systemQuantity: z.coerce.number().min(0),
});

const HeaderSchema = z.object({
  auditedAt: z.string().trim().min(1),
  notes: z.string().trim().optional().or(z.literal("")),
});

export async function createAudit(formData: FormData) {
  const project = await getActiveProject();
  if (!project) throw new Error("აქტიური პროექტი არ არის. გაუშვი db:seed.");

  const header = HeaderSchema.parse({
    auditedAt: formData.get("auditedAt"),
    notes: formData.get("notes") ?? "",
  });

  const itemsJson = formData.get("items");
  if (typeof itemsJson !== "string")
    throw new Error("რევიზიის სტრიქონები არ მოიძებნა");
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

  if (items.length === 0) throw new Error("მინიმუმ ერთი მასალა საჭიროა");

  const [audit] = await db
    .insert(audits)
    .values({
      projectId: project.id,
      auditedAt: new Date(header.auditedAt),
      notes: header.notes || null,
    })
    .returning();

  await db.insert(auditItems).values(
    items.map((it) => ({
      auditId: audit.id,
      materialId: it.materialId,
      countedQuantity: String(it.countedQuantity),
      systemQuantity: String(it.systemQuantity),
    })),
  );

  revalidatePath("/audits");
  revalidatePath("/balance");
  revalidatePath("/");
  redirect(`/audits/${audit.id}`);
}

export async function deleteAudit(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  await db.delete(audits).where(eq(audits.id, id));
  revalidatePath("/audits");
  revalidatePath("/balance");
}
