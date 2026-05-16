import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { services } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { updateService } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const [s] = await db.select().from(services).where(eq(services.id, numericId));
  if (!s) notFound();

  const action = updateService.bind(null, numericId);

  return (
    <div className="max-w-2xl">
      <PageHeader title="მომსახურების რედაქტირება" />
      <form action={action} className="card space-y-4">
        <div>
          <label htmlFor="name">დასახელება</label>
          <input id="name" name="name" defaultValue={s.name} required className="mt-1 w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="unit">ერთეული</label>
            <input id="unit" name="unit" defaultValue={s.unit} required className="mt-1 w-full" />
          </div>
          <div>
            <label htmlFor="defaultUnitPrice">ფასი</label>
            <input
              id="defaultUnitPrice"
              name="defaultUnitPrice"
              type="number"
              step="0.0001"
              min="0"
              defaultValue={s.defaultUnitPrice ?? 0}
              className="mt-1 w-full"
            />
          </div>
        </div>
        <div>
          <label htmlFor="notes">შენიშვნა</label>
          <input id="notes" name="notes" defaultValue={s.notes ?? ""} className="mt-1 w-full" />
        </div>
        <div className="flex items-center gap-2">
          <button type="submit" className="btn">შენახვა</button>
          <Link href="/catalog/services" className="btn-secondary">გაუქმება</Link>
        </div>
      </form>
    </div>
  );
}
