import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { audits, auditItems, materials } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { formatDate, formatNumber } from "@/lib/format";
import { deleteAudit } from "../actions";

export const dynamic = "force-dynamic";

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const [audit] = await db.select().from(audits).where(eq(audits.id, numericId));
  if (!audit) notFound();

  const lines = await db
    .select({
      id: auditItems.id,
      countedQuantity: auditItems.countedQuantity,
      systemQuantity: auditItems.systemQuantity,
      materialName: materials.name,
      materialUnit: materials.unit,
    })
    .from(auditItems)
    .leftJoin(materials, eq(materials.id, auditItems.materialId))
    .where(eq(auditItems.auditId, numericId));

  return (
    <div>
      <PageHeader
        title={`რევიზია #${audit.id}`}
        description={formatDate(audit.auditedAt)}
        actions={
          <>
            <Link href="/audits" className="btn-secondary">
              უკან
            </Link>
            <form action={deleteAudit}>
              <input type="hidden" name="id" value={audit.id} />
              <button type="submit" className="btn-destructive">
                წაშლა
              </button>
            </form>
          </>
        }
      />

      {audit.notes && (
        <div className="card mb-6">
          <div className="text-xs text-muted-foreground">შენიშვნა</div>
          <div>{audit.notes}</div>
        </div>
      )}

      <div className="card overflow-x-auto p-0">
        <table>
          <thead>
            <tr>
              <th>მასალა</th>
              <th>ერთეული</th>
              <th className="text-right">სისტემური</th>
              <th className="text-right">დათვლილი</th>
              <th className="text-right">სხვაობა</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => {
              const variance =
                Number(l.countedQuantity) - Number(l.systemQuantity);
              return (
                <tr key={l.id}>
                  <td className="font-medium">{l.materialName ?? "—"}</td>
                  <td>{l.materialUnit ?? "—"}</td>
                  <td className="text-right tabular-nums">
                    {formatNumber(l.systemQuantity, true)}
                  </td>
                  <td className="text-right tabular-nums">
                    {formatNumber(l.countedQuantity, true)}
                  </td>
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
                      {variance.toFixed(4)}
                    </span>
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
