import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { issues, issueItems, materials, segments } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { formatDate, formatNumber } from "@/lib/format";
import { deleteIssue } from "../actions";

export const dynamic = "force-dynamic";

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const [issue] = await db.select().from(issues).where(eq(issues.id, numericId));
  if (!issue) notFound();

  const [segment] = issue.segmentId
    ? await db.select().from(segments).where(eq(segments.id, issue.segmentId))
    : [null];

  const lines = await db
    .select({
      id: issueItems.id,
      project: issueItems.project,
      category: issueItems.category,
      quantity: issueItems.quantity,
      materialName: materials.name,
      materialUnit: materials.unit,
    })
    .from(issueItems)
    .leftJoin(materials, eq(materials.id, issueItems.materialId))
    .where(eq(issueItems.issueId, numericId));

  return (
    <div>
      <PageHeader
        title={`გატანა #${issue.id}`}
        description={`${formatDate(issue.issuedAt)} • ${segment?.name ?? "სეგმენტის გარეშე"}`}
        actions={
          <>
            <Link href="/issues" className="btn-secondary">
              უკან
            </Link>
            <form action={deleteIssue}>
              <input type="hidden" name="id" value={issue.id} />
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
          <div className="font-medium">{formatDate(issue.issuedAt)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">სეგმენტი</div>
          <div className="font-medium">
            {segment ? `${segment.code ?? ""} ${segment.name}`.trim() : "—"}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">გამცემი</div>
          <div className="font-medium">{issue.issuedBy ?? "—"}</div>
        </div>
        {issue.notes && (
          <div className="md:col-span-3">
            <div className="text-xs text-muted-foreground">შენიშვნა</div>
            <div>{issue.notes}</div>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
