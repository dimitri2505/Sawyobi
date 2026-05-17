import { sql } from "drizzle-orm";
import { db } from "@/db";

export interface LowStockRow {
  material_id: number;
  name: string;
  unit: string;
  remaining: string;
  planned: string;
  severity: "danger" | "warning";
  [key: string]: unknown;
}

export async function getLowStockWarnings(): Promise<LowStockRow[]> {
  const rows = await db.execute<LowStockRow>(sql`
    WITH planned AS (
      SELECT material_id, COALESCE(SUM(quantity_planned), 0) AS qty
      FROM budget_items
      WHERE material_id IS NOT NULL
      GROUP BY material_id
    )
    SELECT
      s.material_id,
      s.name,
      s.unit,
      s.remaining::text,
      COALESCE(p.qty, 0)::text AS planned,
      CASE
        WHEN s.remaining::numeric < 0 THEN 'danger'
        ELSE 'warning'
      END AS severity
    FROM v_stock s
    LEFT JOIN planned p ON p.material_id = s.material_id
    WHERE s.remaining::numeric < 0
       OR (p.qty::numeric > 0 AND s.remaining::numeric < p.qty::numeric * 0.2)
    ORDER BY s.remaining::numeric ASC
  `);
  return rows.rows ?? (rows as unknown as LowStockRow[]);
}

export interface PriceChangeRow {
  material_id: number;
  name: string;
  unit: string;
  latest_price: string;
  prev_price: string;
  pct_change: string;
  [key: string]: unknown;
}

export async function getPriceChanges(): Promise<PriceChangeRow[]> {
  const rows = await db.execute<PriceChangeRow>(sql`
    WITH ranked AS (
      SELECT
        pi.material_id,
        m.name,
        m.unit,
        pi.unit_price,
        p.purchased_at,
        ROW_NUMBER() OVER (PARTITION BY pi.material_id ORDER BY p.purchased_at DESC) AS rn
      FROM purchase_items pi
      JOIN purchases p ON p.id = pi.purchase_id
      JOIN materials m ON m.id = pi.material_id
    )
    SELECT
      r1.material_id,
      r1.name,
      r1.unit,
      r1.unit_price::text AS latest_price,
      r2.unit_price::text AS prev_price,
      ROUND(
        (r1.unit_price::numeric - r2.unit_price::numeric)
        / NULLIF(r2.unit_price::numeric, 0) * 100, 1
      )::text AS pct_change
    FROM ranked r1
    JOIN ranked r2 ON r2.material_id = r1.material_id AND r2.rn = 2
    WHERE r1.rn = 1
      AND ABS(r1.unit_price::numeric - r2.unit_price::numeric)
          / NULLIF(r2.unit_price::numeric, 0) > 0.10
    ORDER BY ABS(
      (r1.unit_price::numeric - r2.unit_price::numeric)
      / NULLIF(r2.unit_price::numeric, 0)
    ) DESC
  `);
  return rows.rows ?? (rows as unknown as PriceChangeRow[]);
}

export interface LastPriceRow {
  material_id: number;
  last_price: string;
  [key: string]: unknown;
}

export async function getLastPrices(): Promise<LastPriceRow[]> {
  const rows = await db.execute<LastPriceRow>(sql`
    SELECT DISTINCT ON (pi.material_id)
      pi.material_id,
      pi.unit_price::text AS last_price
    FROM purchase_items pi
    JOIN purchases p ON p.id = pi.purchase_id
    ORDER BY pi.material_id, p.purchased_at DESC
  `);
  return rows.rows ?? (rows as unknown as LastPriceRow[]);
}

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
