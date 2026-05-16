import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { laborItems } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { updateLabor } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditLaborPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const [l] = await db.select().from(laborItems).where(eq(laborItems.id, numericId));
  if (!l) notFound();

  const action = updateLabor.bind(null, numericId);

  return (
    <div className="max-w-2xl">
      <PageHeader title="სამუშაოს რედაქტირება" />
      <form action={action} className="card space-y-4">
        <div>
          <label htmlFor="name">დასახელება</label>
          <input id="name" name="name" defaultValue={l.name} required className="mt-1 w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="unit">ერთეული</label>
            <input id="unit" name="unit" defaultValue={l.unit} required className="mt-1 w-full" />
          </div>
          <div>
            <label htmlFor="defaultUnitPrice">ფასი</label>
            <input
              id="defaultUnitPrice"
              name="defaultUnitPrice"
              type="number"
              step="0.0001"
              min="0"
              defaultValue={l.defaultUnitPrice ?? 0}
              className="mt-1 w-full"
            />
          </div>
        </div>
        <div>
          <label htmlFor="notes">შენიშვნა</label>
          <input id="notes" name="notes" defaultValue={l.notes ?? ""} className="mt-1 w-full" />
        </div>
        <div className="flex items-center gap-2">
          <button type="submit" className="btn">შენახვა</button>
          <Link href="/catalog/labor" className="btn-secondary">გაუქმება</Link>
        </div>
      </form>
    </div>
  );
}
