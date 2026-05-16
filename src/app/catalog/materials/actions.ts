"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { materials } from "@/db/schema";

const Schema = z.object({
  name: z.string().trim().min(1, "სახელი სავალდებულოა"),
  unit: z.string().trim().min(1, "ერთეული სავალდებულოა"),
  defaultUnitPrice: z.coerce.number().min(0).default(0),
  notes: z.string().trim().optional().or(z.literal("")),
});

function parse(formData: FormData) {
  return Schema.parse({
    name: formData.get("name"),
    unit: formData.get("unit"),
    defaultUnitPrice: formData.get("defaultUnitPrice") ?? 0,
    notes: formData.get("notes") ?? "",
  });
}

export async function createMaterial(formData: FormData) {
  const data = parse(formData);
  await db.insert(materials).values({
    name: data.name,
    unit: data.unit,
    defaultUnitPrice: String(data.defaultUnitPrice),
    notes: data.notes || null,
  });
  revalidatePath("/catalog/materials");
}

export async function updateMaterial(id: number, formData: FormData) {
  const data = parse(formData);
  await db
    .update(materials)
    .set({
      name: data.name,
      unit: data.unit,
      defaultUnitPrice: String(data.defaultUnitPrice),
      notes: data.notes || null,
    })
    .where(eq(materials.id, id));
  revalidatePath("/catalog/materials");
  redirect("/catalog/materials");
}

export async function deleteMaterial(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  await db.delete(materials).where(eq(materials.id, id));
  revalidatePath("/catalog/materials");
}
