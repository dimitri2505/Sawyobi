import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { Plus, Trash2 } from "lucide-react";
import { db } from "@/db";
import { issues, issueItems, segments } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { formatDate, formatNumber } from "@/lib/format";
import { deleteIssue } from "./actions";

export const dynamic = "force-dynamic";

export default async function IssuesPage() {
  const rows = await db
    .select({
      id: issues.id,
      issuedAt: issues.issuedAt,
      issuedBy: issues.issuedBy,
      segmentName: segments.name,
      segmentCode: segments.code,
      lineCount: sql<number>`COUNT(${issueItems.id})::int`.as("line_count"),
      qtyTotal: sql<string>`COALESCE(SUM(${issueItems.quantity}), 0)`.as(
        "qty_total",
      ),
    })
    .from(issues)
    .leftJoin(issueItems, eq(issueItems.issueId, issues.id))
    .leftJoin(segments, eq(segments.id, issues.segmentId))
    .groupBy(issues.id, segments.name, segments.code)
    .orderBy(desc(issues.issuedAt));

  return (
    <div>
      <PageHeader
        title="გატანები"
        description="საწყობიდან გატანილი მასალის ისტორია."
        actions={
          <Link href="/issues/new" className="btn">
            <Plus className="h-4 w-4" />
            გატანა
          </Link>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="გატანა ჯერ არ არის"
          description="დააფიქსირე საწყობიდან გატანილი მასალა."
          action={
            <Link href="/issues/new" className="btn">
              <Plus className="h-4 w-4" />
              გატანა
            </Link>
          }
        />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table>
            <thead>
              <tr>
                <th>თარიღი</th>
                <th>სეგმენტი</th>
                <th>გამცემი</th>
                <th className="text-right">პოზიცია</th>
                <th className="text-right">ჯამური რაოდენობა</th>
                <th className="w-32 text-right">მოქმედება</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.issuedAt)}</td>
                  <td>
                    {r.segmentName ? (
                      <span>
                        {r.segmentCode ? (
                          <span className="text-muted-foreground">
                            {r.segmentCode}{" "}
                          </span>
                        ) : null}
                        {r.segmentName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="text-muted-foreground">{r.issuedBy ?? "—"}</td>
                  <td className="text-right tabular-nums">{r.lineCount}</td>
                  <td className="text-right tabular-nums">{formatNumber(r.qtyTotal)}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/issues/${r.id}`} className="btn-ghost">
                        ნახვა
                      </Link>
                      <form action={deleteIssue}>
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
