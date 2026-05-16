import { asc } from "drizzle-orm";
import { db } from "@/db";
import { materials } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { PurchaseForm } from "./PurchaseForm";

export const dynamic = "force-dynamic";

export default async function NewPurchasePage() {
  const mats = await db
    .select({
      id: materials.id,
      name: materials.name,
      unit: materials.unit,
      defaultUnitPrice: materials.defaultUnitPrice,
    })
    .from(materials)
    .orderBy(asc(materials.name));

  return (
    <div>
      <PageHeader
        title="ახალი შეძენა"
        description="საწყობში შემოსული მასალის ფორმა."
      />
      <PurchaseForm materials={mats} />
    </div>
  );
}
