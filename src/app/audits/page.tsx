import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { Plus, Trash2 } from "lucide-react";
import { db } from "@/db";
import { audits, auditItems } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { formatDate, formatNumber } from "@/lib/format";
import { deleteAudit } from "./actions";

export const dynamic = "force-dynamic";

export default async function AuditsPage() {
  const rows = await db
    .select({
      id: audits.id,
      auditedAt: audits.auditedAt,
      notes: audits.notes,
      lineCount: sql<number>`COUNT(${auditItems.id})::int`.as("line_count"),
      varianceTotal:
        sql<string>`COALESCE(SUM(${auditItems.countedQuantity} - ${auditItems.systemQuantity}), 0)`.as(
          "variance_total",
        ),
    })
    .from(audits)
    .leftJoin(auditItems, eq(auditItems.auditId, audits.id))
    .groupBy(audits.id)
    .orderBy(desc(audits.auditedAt));

  return (
    <div>
      <PageHeader
        title="რევიზია"
        description="საწყობში არსებული რეალური ნაშთის შედარება სისტემურთან."
        actions={
          <Link href="/audits/new" className="btn">
            <Plus className="h-4 w-4" />
            ახალი რევიზია
          </Link>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="რევიზია ჯერ არ ჩატარებულა"
          action={
            <Link href="/audits/new" className="btn">
              <Plus className="h-4 w-4" />
              ახალი რევიზია
            </Link>
          }
        />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table>
            <thead>
              <tr>
                <th>თარიღი</th>
                <th>შენიშვნა</th>
                <th className="text-right">პოზიცია</th>
                <th className="text-right">ჯამური განსხვავება</th>
                <th className="w-32 text-right">მოქმედება</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const variance = Number(r.varianceTotal);
                return (
                  <tr key={r.id}>
                    <td>{formatDate(r.auditedAt)}</td>
                    <td className="text-muted-foreground">{r.notes ?? "—"}</td>
                    <td className="text-right tabular-nums">{r.lineCount}</td>
                    <td className="text-right tabular-nums">
                      <span
                        className={
                          variance < 0
                            ? "text-destructive"
                            : variance > 0
                              ? "text-emerald-600"
                              : ""
                        }
                      >
                        {formatNumber(r.varianceTotal, true)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/audits/${r.id}`} className="btn-ghost">
                          ნახვა
                        </Link>
                        <form action={deleteAudit}>
                          <input type="hidden" name="id" value={r.id} />
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
      )}
    </div>
  );
}
