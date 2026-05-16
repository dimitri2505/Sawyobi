import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { formatNumber } from "@/lib/format";
import { getStockRows, getPlannedQuantities } from "@/db/queries/stock";
import { Boxes } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BalancePage() {
  const [stock, planned] = await Promise.all([
    getStockRows(),
    getPlannedQuantities(),
  ]);

  const plannedByMaterial = new Map<number, number>();
  for (const p of planned)
    plannedByMaterial.set(p.material_id, Number(p.planned_quantity));

  return (
    <div>
      <PageHeader
        title="საწყობის ბალანსი"
        description="თითოეული მასალის ნაშთი: დაგეგმილი vs შემოსული vs გატანილი vs დარჩენილი."
      />

      {stock.length === 0 ? (
        <EmptyState
          title="ცარიელია"
          description="ჯერ არცერთი მასალა არ არის დარეგისტრირებული საწყობში."
          icon={<Boxes className="h-6 w-6" />}
        />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table>
            <thead>
              <tr>
                <th>მასალა</th>
                <th>ერთ.</th>
                <th className="text-right">დაგეგმილი</th>
                <th className="text-right">შემოსული</th>
                <th className="text-right">გატანილი</th>
                <th className="text-right">რევიზიის სხვაობა</th>
                <th className="text-right">ნაშთი</th>
                <th className="text-right">დარჩა გეგმიდან</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((row) => {
                const plan = plannedByMaterial.get(row.material_id) ?? 0;
                const remaining = Number(row.remaining);
                const purchased = Number(row.purchased);
                const issued = Number(row.issued);
                const adj = Number(row.audit_adjustment);
                const fromPlan = plan - issued;

                return (
                  <tr key={row.material_id}>
                    <td className="font-medium">{row.name}</td>
                    <td className="text-muted-foreground">{row.unit}</td>
                    <td className="text-right tabular-nums">
                      {plan ? formatNumber(plan) : "—"}
                    </td>
                    <td className="text-right tabular-nums">{formatNumber(purchased)}</td>
                    <td className="text-right tabular-nums">{formatNumber(issued)}</td>
                    <td className="text-right tabular-nums">
                      {adj === 0 ? (
                        "—"
                      ) : (
                        <span
                          className={
                            adj < 0 ? "text-destructive" : "text-emerald-600"
                          }
                        >
                          {formatNumber(adj, true)}
                        </span>
                      )}
                    </td>
                    <td className="text-right tabular-nums">
                      <span
                        className={
                          remaining < 0
                            ? "text-destructive font-medium"
                            : remaining === 0
                              ? "text-muted-foreground"
                              : "font-medium"
                        }
                      >
                        {formatNumber(remaining, true)}
                      </span>
                    </td>
                    <td className="text-right tabular-nums">
                      {plan ? (
                        <span
                          className={
                            fromPlan < 0 ? "text-destructive" : ""
                          }
                        >
                          {formatNumber(fromPlan)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
