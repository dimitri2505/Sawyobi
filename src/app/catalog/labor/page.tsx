import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { db } from "@/db";
import { laborItems } from "@/db/schema";
import { asc } from "drizzle-orm";
import { PageHeader } from "@/components/page-header";
import { formatMoney } from "@/lib/format";
import { createLabor, deleteLabor } from "./actions";

export const dynamic = "force-dynamic";

export default async function LaborPage() {
  const rows = await db.select().from(laborItems).orderBy(asc(laborItems.name));

  return (
    <div>
      <PageHeader
        title="ხელფასები"
        description="სამუშაოების / შრომის ფასების კატალოგი."
      />

      <div className="card mb-6">
        <h2 className="mb-3 text-sm font-semibold">ახალი სამუშაო</h2>
        <form
          action={createLabor}
          className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_120px_140px_2fr_auto]"
        >
          <input name="name" placeholder="დასახელება" required />
          <input name="unit" placeholder="ერთ." required />
          <input
            name="defaultUnitPrice"
            type="number"
            step="0.0001"
            min="0"
            placeholder="ფასი"
            defaultValue={0}
          />
          <input name="notes" placeholder="შენიშვნა" />
          <button type="submit" className="btn">დამატება</button>
        </form>
      </div>

      <div className="card overflow-x-auto p-0">
        <table>
          <thead>
            <tr>
              <th>დასახელება</th>
              <th>ერთეული</th>
              <th className="text-right">ფასი</th>
              <th>შენიშვნა</th>
              <th className="w-32 text-right">მოქმედება</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-muted-foreground">
                  ცარიელია.
                </td>
              </tr>
            )}
            {rows.map((l) => (
              <tr key={l.id}>
                <td className="font-medium">{l.name}</td>
                <td>{l.unit}</td>
                <td className="text-right tabular-nums">{formatMoney(l.defaultUnitPrice)}</td>
                <td className="text-muted-foreground">{l.notes ?? ""}</td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/catalog/labor/${l.id}`}
                      className="btn-ghost"
                      aria-label="რედაქტირება"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <form action={deleteLabor}>
                      <input type="hidden" name="id" value={l.id} />
                      <button type="submit" className="btn-ghost text-destructive" aria-label="წაშლა">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
