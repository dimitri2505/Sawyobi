"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { services } from "@/db/schema";

const Schema = z.object({
  name: z.string().trim().min(1),
  unit: z.string().trim().min(1),
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

export async function createService(formData: FormData) {
  const data = parse(formData);
  await db.insert(services).values({
    name: data.name,
    unit: data.unit,
    defaultUnitPrice: String(data.defaultUnitPrice),
    notes: data.notes || null,
  });
  revalidatePath("/catalog/services");
}

export async function updateService(id: number, formData: FormData) {
  const data = parse(formData);
  await db
    .update(services)
    .set({
      name: data.name,
      unit: data.unit,
      defaultUnitPrice: String(data.defaultUnitPrice),
      notes: data.notes || null,
    })
    .where(eq(services.id, id));
  revalidatePath("/catalog/services");
  redirect("/catalog/services");
}

export async function deleteService(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  await db.delete(services).where(eq(services.id, id));
  revalidatePath("/catalog/services");
}
