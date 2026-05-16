import { sql } from "drizzle-orm";
import { db } from "@/db";

export interface StockRow {
  material_id: number;
  name: string;
  unit: string;
  default_unit_price: string;
  purchased: string;
  issued: string;
  audit_adjustment: string;
  remaining: string;
  [key: string]: unknown;
}

export async function getStockRows(): Promise<StockRow[]> {
  const rows = await db.execute<StockRow>(
    sql`SELECT * FROM v_stock ORDER BY name`,
  );
  return rows.rows ?? (rows as unknown as StockRow[]);
}

export async function getStockForMaterial(
  materialId: number,
): Promise<StockRow | null> {
  const result = await db.execute<StockRow>(
    sql`SELECT * FROM v_stock WHERE material_id = ${materialId}`,
  );
  const rows = (result.rows ?? (result as unknown as StockRow[])) as StockRow[];
  return rows[0] ?? null;
}

export interface PlannedRow {
  material_id: number;
  planned_quantity: string;
  [key: string]: unknown;
}

export async function getPlannedQuantities(): Promise<PlannedRow[]> {
  const rows = await db.execute<PlannedRow>(
    sql`SELECT material_id, COALESCE(SUM(quantity_planned), 0)::text AS planned_quantity
        FROM budget_items
        WHERE material_id IS NOT NULL
        GROUP BY material_id`,
  );
  return rows.rows ?? (rows as unknown as PlannedRow[]);
}
