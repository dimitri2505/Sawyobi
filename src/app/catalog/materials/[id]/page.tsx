import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { materials } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { updateMaterial } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const [m] = await db
    .select()
    .from(materials)
    .where(eq(materials.id, numericId));
  if (!m) notFound();

  const updateAction = updateMaterial.bind(null, numericId);

  return (
    <div className="max-w-2xl">
      <PageHeader title="მასალის რედაქტირება" />

      <form action={updateAction} className="card space-y-4">
        <div>
          <label htmlFor="name">დასახელება</label>
          <input
            id="name"
            name="name"
            defaultValue={m.name}
            required
            className="mt-1 w-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="unit">ერთეული</label>
            <input
              id="unit"
              name="unit"
              defaultValue={m.unit}
              required
              className="mt-1 w-full"
            />
          </div>
          <div>
            <label htmlFor="defaultUnitPrice">საწყისი ფასი</label>
            <input
              id="defaultUnitPrice"
              name="defaultUnitPrice"
              type="number"
              step="0.0001"
              min="0"
              defaultValue={m.defaultUnitPrice ?? 0}
              className="mt-1 w-full"
            />
          </div>
        </div>
        <div>
          <label htmlFor="notes">შენიშვნა</label>
          <input
            id="notes"
            name="notes"
            defaultValue={m.notes ?? ""}
            className="mt-1 w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <button type="submit" className="btn">
            შენახვა
          </button>
          <Link href="/catalog/materials" className="btn-secondary">
            გაუქმება
          </Link>
        </div>
      </form>
    </div>
  );
}
