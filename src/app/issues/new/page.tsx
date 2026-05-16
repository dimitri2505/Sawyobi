import { asc } from "drizzle-orm";
import { db } from "@/db";
import { segments } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { getStockRows } from "@/db/queries/stock";
import { IssueForm, type MaterialOption } from "./IssueForm";

export const dynamic = "force-dynamic";

export default async function NewIssuePage() {
  const [stock, segs] = await Promise.all([
    getStockRows(),
    db
      .select({
        id: segments.id,
        code: segments.code,
        name: segments.name,
        parentId: segments.parentSegmentId,
      })
      .from(segments)
      .orderBy(asc(segments.sortOrder)),
  ]);

  const materialOptions: MaterialOption[] = stock.map((s) => ({
    id: s.material_id,
    name: s.name,
    unit: s.unit,
    remaining: Number(s.remaining),
  }));

  return (
    <div>
      <PageHeader
        title="გატანა საწყობიდან"
        description="აირჩიე სეგმენტი (ბიუჯეტის ნაწილი) და მიუთითე გასატანი მასალები."
      />
      <IssueForm materials={materialOptions} segmentOptions={segs} />
    </div>
  );
}
