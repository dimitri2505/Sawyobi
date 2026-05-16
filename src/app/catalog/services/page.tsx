import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { db } from "@/db";
import { services } from "@/db/schema";
import { asc } from "drizzle-orm";
import { PageHeader } from "@/components/page-header";
import { formatMoney } from "@/lib/format";
import { createService, deleteService } from "./actions";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const rows = await db.select().from(services).orderBy(asc(services.name));

  return (
    <div>
      <PageHeader
        title="მომსახურება"
        description="მომსახურების კატალოგი (ლიფტი, საფასადე სამუშაო, დაცვა, ა.შ.)."
      />

      <div className="card mb-6">
        <h2 className="mb-3 text-sm font-semibold">ახალი მომსახურება</h2>
        <form
          action={createService}
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
            {rows.map((s) => (
              <tr key={s.id}>
                <td className="font-medium">{s.name}</td>
                <td>{s.unit}</td>
                <td className="text-right tabular-nums">
                  {formatMoney(s.defaultUnitPrice)}
                </td>
                <td className="text-muted-foreground">{s.notes ?? ""}</td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/catalog/services/${s.id}`}
                      className="btn-ghost"
                      aria-label="რედაქტირება"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <form action={deleteService}>
                      <input type="hidden" name="id" value={s.id} />
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
