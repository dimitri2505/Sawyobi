import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { db } from "@/db";
import { materials } from "@/db/schema";
import { asc } from "drizzle-orm";
import { PageHeader } from "@/components/page-header";
import { formatMoney, formatNumber } from "@/lib/format";
import { getStockRows, getPlannedQuantities } from "@/db/queries/stock";
import { createMaterial, deleteMaterial } from "./actions";

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  const [rows, stock, planned] = await Promise.all([
    db.select().from(materials).orderBy(asc(materials.name)),
    getStockRows(),
    getPlannedQuantities(),
  ]);

  const stockByMaterial = new Map(stock.map((s) => [s.material_id, s]));
  const plannedByMaterial = new Map(
    planned.map((p) => [p.material_id, Number(p.planned_quantity)]),
  );

  return (
    <div>
      <PageHeader
        title="მასალები"
        description="საწყობში არსებული მასალების კატალოგი და მათი ნაშთი."
      />

      <div className="card mb-6">
        <h2 className="mb-3 text-sm font-semibold">ახალი მასალის დამატება</h2>
        <form
          action={createMaterial}
          className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_120px_140px_2fr_auto]"
        >
          <input
            name="name"
            placeholder="დასახელება"
            required
            className="md:col-span-1"
          />
          <input name="unit" placeholder="ერთ. (მ3, კგ)" required />
          <input
            name="defaultUnitPrice"
            type="number"
            step="0.0001"
            min="0"
            placeholder="ფასი"
            defaultValue={0}
          />
          <input name="notes" placeholder="შენიშვნა" />
          <button type="submit" className="btn">
            დამატება
          </button>
        </form>
      </div>

      <div className="card overflow-x-auto p-0">
        <table>
          <thead>
            <tr>
              <th>დასახელება</th>
              <th>ერთ.</th>
              <th className="text-right">საწყისი ფასი</th>
              <th className="text-right">დაგეგმილი</th>
              <th className="text-right">შემოსული</th>
              <th className="text-right">გატანილი</th>
              <th className="text-right">ნაშთი</th>
              <th className="w-28 text-right">მოქმედება</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-muted-foreground">
                  ცარიელია — დაამატე ახალი მასალა ან გაუშვი{" "}
                  <code className="rounded bg-muted px-1 py-0.5">
                    npm run db:seed
                  </code>
                </td>
              </tr>
            )}
            {rows.map((m) => {
              const s = stockByMaterial.get(m.id);
              const plan = plannedByMaterial.get(m.id) ?? 0;
              const purchased = s ? Number(s.purchased) : 0;
              const issued = s ? Number(s.issued) : 0;
              const remaining = s ? Number(s.remaining) : 0;
              return (
                <tr key={m.id}>
                  <td className="font-medium">{m.name}</td>
                  <td className="text-muted-foreground">{m.unit}</td>
                  <td className="text-right tabular-nums">
                    {formatMoney(m.defaultUnitPrice)}
                  </td>
                  <td className="text-right tabular-nums text-muted-foreground">
                    {plan ? formatNumber(plan) : "—"}
                  </td>
                  <td className="text-right tabular-nums">
                    {purchased ? formatNumber(purchased) : "—"}
                  </td>
                  <td className="text-right tabular-nums">
                    {issued ? formatNumber(issued) : "—"}
                  </td>
                  <td className="text-right tabular-nums">
                    <span
                      className={
                        remaining < 0
                          ? "font-semibold text-destructive"
                          : remaining === 0
                            ? "text-muted-foreground"
                            : "font-semibold"
                      }
                    >
                      {formatNumber(remaining, true)}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/catalog/materials/${m.id}`}
                        className="btn-ghost"
                        aria-label="რედაქტირება"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <form action={deleteMaterial}>
                        <input type="hidden" name="id" value={m.id} />
                        <button
                          type="submit"
                          className="btn-ghost text-destructive"
                          aria-label="წაშლა"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
