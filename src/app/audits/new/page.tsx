import { PageHeader } from "@/components/page-header";
import { getStockRows } from "@/db/queries/stock";
import { AuditForm, type MaterialOption } from "./AuditForm";

export const dynamic = "force-dynamic";

export default async function NewAuditPage() {
  const stock = await getStockRows();
  const materialOptions: MaterialOption[] = stock.map((s) => ({
    id: s.material_id,
    name: s.name,
    unit: s.unit,
    remaining: Number(s.remaining),
  }));

  return (
    <div>
      <PageHeader
        title="ახალი რევიზია"
        description="დაითვალე რეალური ნაშთი და შეადარე სისტემურს."
      />
      <AuditForm materials={materialOptions} />
    </div>
  );
}
