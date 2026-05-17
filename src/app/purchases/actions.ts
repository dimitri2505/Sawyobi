"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { purchases, purchaseItems } from "@/db/schema";
import { getActiveProject } from "@/db/queries/project";

const ItemSchema = z.object({
  project: z.string().trim().nullable().optional(),
  category: z.string().trim().nullable().optional(),
  materialId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().min(0).default(0),
});

const PurchaseSchema = z.object({
  supplier: z.string().trim().optional().or(z.literal("")),
  invoiceNo: z.string().trim().optional().or(z.literal("")),
  purchasedAt: z.string().trim().min(1),
  notes: z.string().trim().optional().or(z.literal("")),
});

export async function createPurchase(formData: FormData) {
  const project = await getActiveProject();
  if (!project) throw new Error("აქტიური პროექტი არ არის. გაუშვი db:seed.");

  const header = PurchaseSchema.parse({
    supplier: formData.get("supplier") ?? "",
    invoiceNo: formData.get("invoiceNo") ?? "",
    purchasedAt: formData.get("purchasedAt"),
    notes: formData.get("notes") ?? "",
  });

  const itemsJson = formData.get("items");
  if (typeof itemsJson !== "string") {
    throw new Error("შეძენის სტრიქონები არ მოიძებნა");
  }
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

  if (items.length === 0) {
    throw new Error("მინიმუმ ერთი მასალა საჭიროა");
  }

  const [purchase] = await db
    .insert(purchases)
    .values({
      projectId: project.id,
      supplier: header.supplier || null,
      invoiceNo: header.invoiceNo || null,
      purchasedAt: new Date(header.purchasedAt),
      notes: header.notes || null,
    })
    .returning();

  await db.insert(purchaseItems).values(
    items.map((it) => ({
      purchaseId: purchase.id,
      project: it.project || null,
      category: it.category || null,
      materialId: it.materialId,
      quantity: String(it.quantity),
      unitPrice: String(it.unitPrice),
    })),
  );

  revalidatePath("/purchases");
  revalidatePath("/balance");
  revalidatePath("/");
  redirect(`/purchases/${purchase.id}`);
}

export async function deletePurchase(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  await db.delete(purchases).where(eq(purchases.id, id));
  revalidatePath("/purchases");
  revalidatePath("/balance");
  revalidatePath("/");
}
