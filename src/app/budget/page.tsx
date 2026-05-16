import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { segments, budgetItems, materials, issues, issueItems } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { formatMoney, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

interface SegmentNode {
  id: number;
  code: string | null;
  name: string;
  parentId: number | null;
  sortOrder: number;
  children: SegmentNode[];
  items: BudgetItemRow[];
}

interface BudgetItemRow {
  id: number;
  kind: "material" | "service" | "labor";
  materialId: number | null;
  name: string | null;
  unit: string | null;
  quantityPlanned: string | null;
  unitPrice: string | null;
}

export default async function BudgetPage() {
  const segs = await db
    .select({
      id: segments.id,
      code: segments.code,
      name: segments.name,
      parentId: segments.parentSegmentId,
      sortOrder: segments.sortOrder,
    })
    .from(segments)
    .orderBy(asc(segments.sortOrder));

  if (segs.length === 0) {
    return (
      <div>
        <PageHeader title="ბიუჯეტი" />
        <EmptyState
          title="ბიუჯეტი ცარიელია"
          description="გაუშვი npm run db:seed რომ ჩაიტვირთოს Excel-დან."
        />
      </div>
    );
  }

  const items = await db
    .select({
      id: budgetItems.id,
      segmentId: budgetItems.segmentId,
      kind: budgetItems.kind,
      materialId: budgetItems.materialId,
      name: budgetItems.name,
      unit: budgetItems.unit,
      quantityPlanned: budgetItems.quantityPlanned,
      unitPrice: budgetItems.unitPrice,
    })
    .from(budgetItems)
    .orderBy(asc(budgetItems.id));

  const issuedRows = await db
    .select({
      segmentId: issues.segmentId,
      materialId: issueItems.materialId,
      quantity: sql<string>`COALESCE(SUM(${issueItems.quantity}), 0)`.as(
        "qty",
      ),
    })
    .from(issueItems)
    .leftJoin(issues, eq(issues.id, issueItems.issueId))
    .groupBy(issues.segmentId, issueItems.materialId);

  const issuedMap = new Map<string, number>();
  for (const r of issuedRows) {
    if (r.segmentId === null) continue;
    issuedMap.set(`${r.segmentId}:${r.materialId}`, Number(r.quantity));
  }

  const matNames = new Map<number, string>();
  if (items.some((i) => i.materialId)) {
    const ids = Array.from(
      new Set(items.map((i) => i.materialId).filter((x): x is number => !!x)),
    );
    if (ids.length > 0) {
      const fetched = await db
        .select({ id: materials.id, name: materials.name })
        .from(materials);
      for (const m of fetched) matNames.set(m.id, m.name);
    }
  }

  const nodeMap = new Map<number, SegmentNode>();
  for (const s of segs) {
    nodeMap.set(s.id, {
      id: s.id,
      code: s.code,
      name: s.name,
      parentId: s.parentId,
      sortOrder: s.sortOrder,
      children: [],
      items: [],
    });
  }
  const roots: SegmentNode[] = [];
  for (const node of nodeMap.values()) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  for (const it of items) {
    const node = nodeMap.get(it.segmentId);
    if (node) node.items.push(it as BudgetItemRow);
  }

  function totalPlanned(node: SegmentNode): number {
    let sum = 0;
    for (const it of node.items) {
      sum += Number(it.quantityPlanned ?? 0) * Number(it.unitPrice ?? 0);
    }
    for (const c of node.children) sum += totalPlanned(c);
    return sum;
  }

  return (
    <div>
      <PageHeader
        title="ბიუჯეტი"
        description="დაგეგმილი ვს ფაქტიური. სეგმენტების ხე ჩატვირთულია Excel-დან."
      />

      <div className="space-y-6">
        {roots.map((root) => (
          <SectionBlock
            key={root.id}
            node={root}
            issuedMap={issuedMap}
            matNames={matNames}
            totalPlanned={totalPlanned}
          />
        ))}
      </div>
    </div>
  );
}

function SectionBlock({
  node,
  issuedMap,
  matNames,
  totalPlanned,
}: {
  node: SegmentNode;
  issuedMap: Map<string, number>;
  matNames: Map<number, string>;
  totalPlanned: (n: SegmentNode) => number;
}) {
  return (
    <div className="card p-0">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-xs text-muted-foreground">
            {node.code ? `კოდი ${node.code}` : "სექცია"}
          </div>
          <h2 className="text-lg font-semibold">{node.name}</h2>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">დაგეგმილი ჯამი</div>
          <div className="font-semibold tabular-nums">
            {formatMoney(totalPlanned(node))}
          </div>
        </div>
      </div>
      <div className="p-5">
        {node.items.length > 0 && (
          <SegmentTable
            node={node}
            issuedMap={issuedMap}
            matNames={matNames}
          />
        )}
        {node.children.length > 0 && (
          <div className="mt-4 space-y-3">
            {node.children.map((c) => (
              <Subsection
                key={c.id}
                node={c}
                issuedMap={issuedMap}
                matNames={matNames}
                totalPlanned={totalPlanned}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Subsection({
  node,
  issuedMap,
  matNames,
  totalPlanned,
}: {
  node: SegmentNode;
  issuedMap: Map<string, number>;
  matNames: Map<number, string>;
  totalPlanned: (n: SegmentNode) => number;
}) {
  return (
    <details className="rounded-lg border border-border bg-muted/40 open:bg-card">
      <summary className="flex cursor-pointer items-center justify-between px-4 py-3">
        <div className="font-medium">
          {node.code ? (
            <span className="mr-2 text-muted-foreground">{node.code}</span>
          ) : null}
          {node.name}
        </div>
        <div className="text-sm font-semibold tabular-nums">
          {formatMoney(totalPlanned(node))}
        </div>
      </summary>
      <div className="border-t border-border p-3">
        {node.items.length > 0 && (
          <SegmentTable
            node={node}
            issuedMap={issuedMap}
            matNames={matNames}
          />
        )}
        {node.children.map((c) => (
          <div key={c.id} className="mt-3">
            <Subsection
              node={c}
              issuedMap={issuedMap}
              matNames={matNames}
              totalPlanned={totalPlanned}
            />
          </div>
        ))}
      </div>
    </details>
  );
}

function SegmentTable({
  node,
  issuedMap,
  matNames,
}: {
  node: SegmentNode;
  issuedMap: Map<string, number>;
  matNames: Map<number, string>;
}) {
  return (
    <div className="overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th>მასალა / პოზიცია</th>
            <th>ერთ.</th>
            <th className="text-right">დაგეგმილი რაოდ.</th>
            <th className="text-right">ერთ. ფასი</th>
            <th className="text-right">დაგეგმილი ჯამი</th>
            <th className="text-right">გატანილი</th>
            <th className="text-right">სხვაობა</th>
          </tr>
        </thead>
        <tbody>
          {node.items.map((it) => {
            const planQty = Number(it.quantityPlanned ?? 0);
            const price = Number(it.unitPrice ?? 0);
            const planSum = planQty * price;
            const issued = it.materialId
              ? (issuedMap.get(`${node.id}:${it.materialId}`) ?? 0)
              : 0;
            const remaining = planQty - issued;
            const linkedName = it.materialId
              ? matNames.get(it.materialId)
              : undefined;
            return (
              <tr key={it.id}>
                <td>
                  <div className="font-medium">
                    {it.name ?? linkedName ?? "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {it.kind === "material"
                      ? "მასალა"
                      : it.kind === "service"
                        ? "მომსახურება"
                        : "ხელფასი"}
                  </div>
                </td>
                <td className="text-muted-foreground">{it.unit ?? "—"}</td>
                <td className="text-right tabular-nums">
                  {formatNumber(planQty)}
                </td>
                <td className="text-right tabular-nums">{formatMoney(price)}</td>
                <td className="text-right tabular-nums">{formatMoney(planSum)}</td>
                <td className="text-right tabular-nums">
                  {it.materialId ? formatNumber(issued) : "—"}
                </td>
                <td className="text-right tabular-nums">
                  {it.materialId ? (
                    <span className={remaining < 0 ? "text-destructive" : ""}>
                      {formatNumber(remaining)}
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
  );
}
