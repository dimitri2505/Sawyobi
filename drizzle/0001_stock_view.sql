-- Stock view: per-material balance combining purchases, issues, and audit deltas.
-- "audit delta" = counted_quantity - system_quantity, applied as adjustment.

CREATE OR REPLACE VIEW v_stock AS
WITH purchased AS (
  SELECT material_id, COALESCE(SUM(quantity), 0) AS qty
  FROM purchase_items
  GROUP BY material_id
),
issued AS (
  SELECT material_id, COALESCE(SUM(quantity), 0) AS qty
  FROM issue_items
  GROUP BY material_id
),
audit_adj AS (
  SELECT material_id,
         COALESCE(SUM(counted_quantity - system_quantity), 0) AS qty
  FROM audit_items
  GROUP BY material_id
)
SELECT
  m.id AS material_id,
  m.name,
  m.unit,
  m.default_unit_price,
  COALESCE(p.qty, 0) AS purchased,
  COALESCE(i.qty, 0) AS issued,
  COALESCE(a.qty, 0) AS audit_adjustment,
  COALESCE(p.qty, 0) - COALESCE(i.qty, 0) + COALESCE(a.qty, 0) AS remaining
FROM materials m
LEFT JOIN purchased p ON p.material_id = m.id
LEFT JOIN issued i ON i.material_id = m.id
LEFT JOIN audit_adj a ON a.material_id = m.id;
