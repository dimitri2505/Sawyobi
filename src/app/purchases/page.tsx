import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { Plus, Trash2 } from "lucide-react";
import { db } from "@/db";
import { purchases, purchaseItems } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { deletePurchase } from "./actions";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const rows = await db
    .select({
      id: purchases.id,
      supplier: purchases.supplier,
      invoiceNo: purchases.invoiceNo,
      purchasedAt: purchases.purchasedAt,
      notes: purchases.notes,
      lineCount: sql<number>`COUNT(${purchaseItems.id})::int`.as("line_count"),
      total: sql<string>`COALESCE(SUM(${purchaseItems.quantity} * ${purchaseItems.unitPrice}), 0)`.as(
        "total",
      ),
      qtyTotal: sql<string>`COALESCE(SUM(${purchaseItems.quantity}), 0)`.as(
        "qty_total",
      ),
    })
    .from(purchases)
    .leftJoin(purchaseItems, eq(purchaseItems.purchaseId, purchases.id))
    .groupBy(purchases.id)
    .orderBy(desc(purchases.purchasedAt));

  return (
    <div>
      <PageHeader
        title="შეძენები"
        description="საწყობში შემოსული მასალის ჩანაწერები."
        actions={
          <Link href="/purchases/new" className="btn">
            <Plus className="h-4 w-4" />
            ახალი შეძენა
          </Link>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="შეძენა ჯერ არ არის"
          description="დაამატე საწყობში შემოსული პირველი მასალა."
          action={
            <Link href="/purchases/new" className="btn">
              <Plus className="h-4 w-4" />
              ახალი შეძენა
            </Link>
          }
        />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table>
            <thead>
              <tr>
                <th>თარიღი</th>
                <th>მომწოდებელი</th>
                <th>ინვოისი</th>
                <th className="text-right">პოზიცია</th>
                <th className="text-right">ჯამური რაოდენობა</th>
                <th className="text-right">ჯამური ღირებულება</th>
                <th className="w-32 text-right">მოქმედება</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>{formatDate(p.purchasedAt)}</td>
                  <td className="font-medium">{p.supplier ?? "—"}</td>
                  <td className="text-muted-foreground">{p.invoiceNo ?? "—"}</td>
                  <td className="text-right tabular-nums">{p.lineCount}</td>
                  <td className="text-right tabular-nums">{formatNumber(p.qtyTotal)}</td>
                  <td className="text-right tabular-nums">{formatMoney(p.total)}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/purchases/${p.id}`} className="btn-ghost">
                        ნახვა
                      </Link>
                      <form action={deletePurchase}>
                        <input type="hidden" name="id" value={p.id} />
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
      )}
    </div>
  );
}
