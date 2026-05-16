import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import {
  ArrowRight,
  Boxes,
  ShoppingCart,
  PackageMinus,
  ClipboardCheck,
} from "lucide-react";
import { db } from "@/db";
import {
  purchases,
  purchaseItems,
  issues,
  issueItems,
  audits,
  materials as materialsTable,
} from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { getActiveProject } from "@/db/queries/project";
import { getStockRows } from "@/db/queries/stock";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const project = await getActiveProject();

  if (!project) {
    return (
      <div>
        <PageHeader title="დაფა" />
        <EmptyState
          title="პროექტი ჯერ არ არის შექმნილი"
          description="გაუშვი npm run db:seed რომ ჩაიტვირთოს Excel-დან."
        />
      </div>
    );
  }

  const [purchasedAgg] = await db
    .select({
      total:
        sql<string>`COALESCE(SUM(${purchaseItems.quantity} * ${purchaseItems.unitPrice}), 0)`.as(
          "total",
        ),
      lines: sql<number>`COUNT(${purchaseItems.id})::int`.as("lines"),
    })
    .from(purchaseItems)
    .leftJoin(purchases, eq(purchases.id, purchaseItems.purchaseId))
    .where(eq(purchases.projectId, project.id));

  const [issuedAgg] = await db
    .select({
      lines: sql<number>`COUNT(${issueItems.id})::int`.as("lines"),
      qty: sql<string>`COALESCE(SUM(${issueItems.quantity}), 0)`.as("qty"),
    })
    .from(issueItems)
    .leftJoin(issues, eq(issues.id, issueItems.issueId))
    .where(eq(issues.projectId, project.id));

  const [purchaseCount] = await db
    .select({ c: sql<number>`COUNT(*)::int`.as("c") })
    .from(purchases)
    .where(eq(purchases.projectId, project.id));
  const [issueCount] = await db
    .select({ c: sql<number>`COUNT(*)::int`.as("c") })
    .from(issues)
    .where(eq(issues.projectId, project.id));
  const [auditCount] = await db
    .select({ c: sql<number>`COUNT(*)::int`.as("c") })
    .from(audits)
    .where(eq(audits.projectId, project.id));
  const [materialCount] = await db
    .select({ c: sql<number>`COUNT(*)::int`.as("c") })
    .from(materialsTable);

  const stock = await getStockRows();
  const lowStock = stock
    .filter((s) => Number(s.remaining) < 0)
    .slice(0, 5);

  const recentPurchases = await db
    .select({
      id: purchases.id,
      supplier: purchases.supplier,
      purchasedAt: purchases.purchasedAt,
      total:
        sql<string>`COALESCE(SUM(${purchaseItems.quantity} * ${purchaseItems.unitPrice}), 0)`.as(
          "total",
        ),
    })
    .from(purchases)
    .leftJoin(purchaseItems, eq(purchaseItems.purchaseId, purchases.id))
    .where(eq(purchases.projectId, project.id))
    .groupBy(purchases.id)
    .orderBy(desc(purchases.purchasedAt))
    .limit(5);

  const recentIssues = await db
    .select({
      id: issues.id,
      issuedAt: issues.issuedAt,
      issuedBy: issues.issuedBy,
      qty: sql<string>`COALESCE(SUM(${issueItems.quantity}), 0)`.as("qty"),
    })
    .from(issues)
    .leftJoin(issueItems, eq(issueItems.issueId, issues.id))
    .where(eq(issues.projectId, project.id))
    .groupBy(issues.id)
    .orderBy(desc(issues.issuedAt))
    .limit(5);

  return (
    <div>
      <PageHeader
        title="დაფა"
        description={`${project.name} • ${project.address ?? ""}`}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="ნომენკლატურა"
          value={String(materialCount.c)}
          icon={<Boxes className="h-5 w-5" />}
        />
        <KpiCard
          label="სულ შეძენილი"
          value={formatMoney(purchasedAgg.total)}
          sub={`${purchaseCount.c} ოპერაცია`}
          icon={<ShoppingCart className="h-5 w-5" />}
        />
        <KpiCard
          label="სულ გატანილი"
          value={`${formatNumber(issuedAgg.qty)} ერთ.`}
          sub={`${issueCount.c} ოპერაცია`}
          icon={<PackageMinus className="h-5 w-5" />}
        />
        <KpiCard
          label="რევიზიები"
          value={String(auditCount.c)}
          icon={<ClipboardCheck className="h-5 w-5" />}
        />
      </div>

      {lowStock.length > 0 && (
        <div className="card mb-6 border-destructive/40 bg-red-50">
          <div className="mb-2 text-sm font-semibold text-destructive">
            ⚠ ნაშთი მინუსშია
          </div>
          <ul className="space-y-1 text-sm">
            {lowStock.map((s) => (
              <li key={s.material_id} className="flex justify-between">
                <span>{s.name}</span>
                <span className="tabular-nums text-destructive">
                  {formatNumber(s.remaining, true)} {s.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-0">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">ბოლო შეძენები</h2>
            <Link
              href="/purchases"
              className="flex items-center gap-1 text-sm text-primary"
            >
              ყველა <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {recentPurchases.length === 0 ? (
            <div className="p-5 text-sm text-muted-foreground">ცარიელია.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>თარიღი</th>
                  <th>მომწოდებელი</th>
                  <th className="text-right">ჯამი</th>
                </tr>
              </thead>
              <tbody>
                {recentPurchases.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link
                        href={`/purchases/${p.id}`}
                        className="hover:underline"
                      >
                        {formatDate(p.purchasedAt)}
                      </Link>
                    </td>
                    <td>{p.supplier ?? "—"}</td>
                    <td className="text-right tabular-nums">
                      {formatMoney(p.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card p-0">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">ბოლო გატანები</h2>
            <Link
              href="/issues"
              className="flex items-center gap-1 text-sm text-primary"
            >
              ყველა <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {recentIssues.length === 0 ? (
            <div className="p-5 text-sm text-muted-foreground">ცარიელია.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>თარიღი</th>
                  <th>გამცემი</th>
                  <th className="text-right">რაოდ.</th>
                </tr>
              </thead>
              <tbody>
                {recentIssues.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link
                        href={`/issues/${r.id}`}
                        className="hover:underline"
                      >
                        {formatDate(r.issuedAt)}
                      </Link>
                    </td>
                    <td>{r.issuedBy ?? "—"}</td>
                    <td className="text-right tabular-nums">
                      {formatNumber(r.qty)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="kpi">
      <div className="flex items-start justify-between">
        <div className="kpi-label">{label}</div>
        {icon && (
          <div className="text-muted-foreground" aria-hidden>
            {icon}
          </div>
        )}
      </div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
