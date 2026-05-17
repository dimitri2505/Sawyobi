import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { purchases, purchaseItems, materials } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { deletePurchase } from "../actions";

export const dynamic = "force-dynamic";

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const [purchase] = await db
    .select()
    .from(purchases)
    .where(eq(purchases.id, numericId));
  if (!purchase) notFound();

  const lines = await db
    .select({
      id: purchaseItems.id,
      project: purchaseItems.project,
      category: purchaseItems.category,
      quantity: purchaseItems.quantity,
      unitPrice: purchaseItems.unitPrice,
      materialName: materials.name,
      materialUnit: materials.unit,
    })
    .from(purchaseItems)
    .leftJoin(materials, eq(materials.id, purchaseItems.materialId))
    .where(eq(purchaseItems.purchaseId, numericId));

  const total = lines.reduce(
    (s, l) => s + Number(l.quantity) * Number(l.unitPrice),
    0,
  );

  return (
    <div>
      <PageHeader
        title={`შეძენა #${purchase.id}`}
        description={`${formatDate(purchase.purchasedAt)} • ${purchase.supplier ?? "—"}`}
        actions={
          <>
            <Link href="/purchases" className="btn-secondary">
              უკან
            </Link>
            <form action={deletePurchase}>
              <input type="hidden" name="id" value={purchase.id} />
              <button type="submit" className="btn-destructive">
                წაშლა
              </button>
            </form>
          </>
        }
      />

      <div className="card mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <div className="text-xs text-muted-foreground">თარიღი</div>
          <div className="font-medium">{formatDate(purchase.purchasedAt)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">მომწოდებელი</div>
          <div className="font-medium">{purchase.supplier ?? "—"}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">ინვოისი</div>
          <div className="font-medium">{purchase.invoiceNo ?? "—"}</div>
        </div>
        {purchase.notes && (
          <div className="md:col-span-3">
            <div className="text-xs text-muted-foreground">შენიშვნა</div>
            <div>{purchase.notes}</div>
          </div>
        )}
      </div>

      <div className="card overflow-x-auto p-0">
        <table>
          <thead>
            <tr>
              <th>პროექტი</th>
              <th>კატეგორია</th>
              <th>მასალა</th>
              <th>ერთეული</th>
              <th className="text-right">რაოდენობა</th>
              <th className="text-right">ერთ. ფასი</th>
              <th className="text-right">ჯამი</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id}>
                <td className="text-muted-foreground">{l.project ?? "—"}</td>
                <td className="text-muted-foreground">{l.category ?? "—"}</td>
                <td className="font-medium">{l.materialName ?? "—"}</td>
                <td>{l.materialUnit ?? "—"}</td>
                <td className="text-right tabular-nums">
                  {formatNumber(l.quantity, true)}
                </td>
                <td className="text-right tabular-nums">{formatMoney(l.unitPrice)}</td>
                <td className="text-right tabular-nums">
                  {formatMoney(Number(l.quantity) * Number(l.unitPrice))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6} className="text-right font-medium">
                სულ:
              </td>
              <td className="text-right font-semibold tabular-nums">
                {formatMoney(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
