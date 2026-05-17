import { asc } from "drizzle-orm";
import { db } from "@/db";
import { materials } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { PurchaseForm } from "./PurchaseForm";
import { getLastPrices } from "@/db/queries/stock";

export const dynamic = "force-dynamic";

export default async function NewPurchasePage() {
  const [mats, lastPrices] = await Promise.all([
    db
      .select({
        id: materials.id,
        name: materials.name,
        unit: materials.unit,
        defaultUnitPrice: materials.defaultUnitPrice,
      })
      .from(materials)
      .orderBy(asc(materials.name)),
    getLastPrices(),
  ]);

  const lastPriceMap = new Map(lastPrices.map((r) => [r.material_id, r.last_price]));

  const matsWithLastPrice = mats.map((m) => ({
    ...m,
    lastPrice: lastPriceMap.get(m.id) ?? null,
  }));

  return (
    <div>
      <PageHeader
        title="ახალი შეძენა"
        description="საწყობში შემოსული მასალის ფორმა."
      />
      <PurchaseForm materials={matsWithLastPrice} />
    </div>
  );
}
