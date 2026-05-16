import "dotenv/config";
import { config } from "dotenv";
import path from "node:path";
import fs from "node:fs";
import * as XLSX from "xlsx";
import {
  materials,
  services,
  laborItems,
  projects,
  floors,
  segments,
  budgetItems,
} from "../src/db/schema";
import { eq } from "drizzle-orm";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set in .env.local");
  process.exit(1);
}

const xlsxPath =
  process.env.BUDGET_XLSX ?? path.resolve(process.cwd(), "data/budget.xlsx");

if (!fs.existsSync(xlsxPath)) {
  console.error(
    `Excel file not found at ${xlsxPath}. Set BUDGET_XLSX or place the file at data/budget.xlsx.`,
  );
  process.exit(1);
}

async function getDb() {
  if (url!.startsWith("pglite://")) {
    const dataDir = url!.replace(/^pglite:\/\//, "");
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const client = new PGlite(dataDir);
    return {
      db: drizzle(client) as unknown as ReturnType<
        typeof import("drizzle-orm/neon-http").drizzle
      >,
      close: () => client.close(),
    };
  }
  const { neon } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-http");
  const sql = neon(url!);
  return { db: drizzle(sql), close: async () => {} };
}

let db!: Awaited<ReturnType<typeof getDb>>["db"];
let closeDb: () => Promise<void>;

type Cell = string | number | boolean | null | undefined;
type Row = Cell[];

function cell(row: Row, idx: number): Cell {
  return row[idx];
}

function asString(v: Cell): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function asNumber(v: Cell): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

const SKIP_NAMES = new Set([
  "jami",
  "ჯამი",
  "mTliani",
  "მთლიანი",
  "zednadebi xarji",
  "ზედნადები ხარჯი",
  "yalibi",
  "ყალიბი",
  "teqnika",
  "ტექნიკა",
  "mogeba",
  "მოგება",
  "dRg",
  "დღგ",
]);

function shouldSkipRow(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return true;
  if (SKIP_NAMES.has(trimmed)) return true;
  return false;
}

function loadSheet(wb: XLSX.WorkBook, name: string): Row[] {
  const ws = wb.Sheets[name];
  if (!ws) throw new Error(`Sheet not found: ${name}`);
  return XLSX.utils.sheet_to_json<Row>(ws, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: false,
  });
}

async function seedMaterials(rows: Row[]): Promise<Map<string, number>> {
  const lookup = new Map<string, number>();
  console.log(`Seeding materials (${rows.length} rows)…`);
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    const name = asString(cell(row, 1));
    const unit = asString(cell(row, 2));
    const price = asNumber(cell(row, 3));
    if (!name || shouldSkipRow(name)) continue;
    if (!unit) continue;
    if (lookup.has(name)) continue;
    const [{ id }] = await db
      .insert(materials)
      .values({
        name,
        unit,
        defaultUnitPrice: price !== null ? String(price) : "0",
      })
      .returning({ id: materials.id });
    lookup.set(name, id);
  }
  console.log(`  inserted ${lookup.size} materials.`);
  return lookup;
}

async function seedServices(rows: Row[]): Promise<Map<string, number>> {
  const lookup = new Map<string, number>();
  console.log(`Seeding services (${rows.length} rows)…`);
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    const name = asString(cell(row, 1));
    const unit = asString(cell(row, 2));
    const price = asNumber(cell(row, 3));
    const notes = asString(cell(row, 4));
    if (!name || shouldSkipRow(name)) continue;
    if (!unit) continue;
    if (lookup.has(name)) continue;
    const [{ id }] = await db
      .insert(services)
      .values({
        name,
        unit,
        defaultUnitPrice: price !== null ? String(price) : "0",
        notes: notes || null,
      })
      .returning({ id: services.id });
    lookup.set(name, id);
  }
  console.log(`  inserted ${lookup.size} services.`);
  return lookup;
}

async function seedLabor(rows: Row[]): Promise<Map<string, number>> {
  const lookup = new Map<string, number>();
  console.log(`Seeding labor (${rows.length} rows)…`);
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    const name = asString(cell(row, 1));
    const unit = asString(cell(row, 2));
    const price = asNumber(cell(row, 3));
    if (!name || shouldSkipRow(name)) continue;
    if (!unit) continue;
    if (lookup.has(name)) continue;
    const [{ id }] = await db
      .insert(laborItems)
      .values({
        name,
        unit,
        defaultUnitPrice: price !== null ? String(price) : "0",
      })
      .returning({ id: laborItems.id });
    lookup.set(name, id);
  }
  console.log(`  inserted ${lookup.size} labor items.`);
  return lookup;
}

async function seedFloors(projectId: number, rows: Row[]) {
  console.log("Seeding floors from ფართები…");
  let count = 0;
  for (let i = 4; i < rows.length; i++) {
    const row = rows[i];
    const idx = asNumber(cell(row, 0));
    const label = asString(cell(row, 1));
    const construction = asNumber(cell(row, 2));
    const usable = asNumber(cell(row, 3));

    if (label.toLowerCase() === "jami" || label === "ჯამი") break;
    if (!label) continue;
    if (idx === null || !Number.isInteger(idx)) continue;

    await db.insert(floors).values({
      projectId,
      label,
      constructionArea: construction !== null ? String(construction) : null,
      usableArea: usable !== null ? String(usable) : null,
      sortOrder: idx,
    });
    count++;
  }
  console.log(`  inserted ${count} floors.`);
}

interface SegmentNode {
  id: number;
  code: string | null;
  name: string;
}

async function seedBudget(
  projectId: number,
  rows: Row[],
  matLookup: Map<string, number>,
  svcLookup: Map<string, number>,
  laborLookup: Map<string, number>,
) {
  console.log(`Seeding budget (${rows.length} rows)…`);
  let currentSection: SegmentNode | null = null;
  let currentSegment: SegmentNode | null = null;
  let lastIntegerSegment: SegmentNode | null = null;
  let segCount = 0;
  let itemCount = 0;
  let sortOrder = 0;

  for (let i = 7; i < rows.length; i++) {
    const row = rows[i];
    const codeRaw = cell(row, 0);
    const name = asString(cell(row, 1));
    const unit = asString(cell(row, 2));
    const qty = asNumber(cell(row, 3));
    const matUnitPrice = asNumber(cell(row, 4));

    if (shouldSkipRow(name)) continue;

    const codeStr = asString(codeRaw);
    const codeIsNumeric = codeStr !== "" && !Number.isNaN(Number(codeStr));

    if (!codeIsNumeric && !unit) {
      const [seg] = await db
        .insert(segments)
        .values({
          projectId,
          code: null,
          name,
          parentSegmentId: null,
          sortOrder: sortOrder++,
        })
        .returning();
      currentSection = { id: seg.id, code: null, name: seg.name };
      currentSegment = currentSection;
      lastIntegerSegment = null;
      segCount++;
      continue;
    }

    if (codeIsNumeric) {
      const isDecimal = codeStr.includes(".");
      let parentId: number | null = currentSection?.id ?? null;
      if (isDecimal && lastIntegerSegment) {
        parentId = lastIntegerSegment.id;
      }
      const [seg] = await db
        .insert(segments)
        .values({
          projectId,
          code: codeStr,
          name: name || `Item ${codeStr}`,
          parentSegmentId: parentId,
          sortOrder: sortOrder++,
        })
        .returning();
      const node: SegmentNode = { id: seg.id, code: codeStr, name: seg.name };
      currentSegment = node;
      if (!isDecimal) lastIntegerSegment = node;
      segCount++;
      continue;
    }

    if (!currentSegment) continue;

    let kind: "material" | "service" | "labor" = "material";
    let materialId: number | null = null;
    let serviceId: number | null = null;
    let laborId: number | null = null;

    if (matLookup.has(name)) {
      materialId = matLookup.get(name)!;
      kind = "material";
    } else if (svcLookup.has(name)) {
      serviceId = svcLookup.get(name)!;
      kind = "service";
    } else if (laborLookup.has(name)) {
      laborId = laborLookup.get(name)!;
      kind = "labor";
    } else {
      kind = "material";
    }

    await db.insert(budgetItems).values({
      segmentId: currentSegment.id,
      kind,
      materialId,
      serviceId,
      laborId,
      name,
      unit: unit || null,
      quantityPlanned: qty !== null ? String(qty) : "0",
      unitPrice: matUnitPrice !== null ? String(matUnitPrice) : "0",
    });
    itemCount++;
  }

  console.log(`  inserted ${segCount} segments, ${itemCount} budget items.`);
}

async function main() {
  console.log(`Reading ${xlsxPath}`);
  const wb = XLSX.readFile(xlsxPath);

  const conn = await getDb();
  db = conn.db;
  closeDb = conn.close;

  const matRows = loadSheet(wb, "მასალა");
  const svcRows = loadSheet(wb, "მომსახურება");
  const laborRows = loadSheet(wb, "ხელფასები");
  const areasRows = loadSheet(wb, "ფართები");
  const budgetRows = loadSheet(wb, "ბიუჯეტი");

  console.log("Wiping existing data (re-seed)…");
  await db.delete(budgetItems);
  await db.delete(segments);
  await db.delete(floors);
  await db.delete(projects);
  await db.delete(materials);
  await db.delete(services);
  await db.delete(laborItems);

  const matLookup = await seedMaterials(matRows);
  const svcLookup = await seedServices(svcRows);
  const laborLookup = await seedLabor(laborRows);

  const existing = await db
    .select()
    .from(projects)
    .where(eq(projects.name, "სახლი #2"));
  let project = existing[0];
  if (!project) {
    const [p] = await db
      .insert(projects)
      .values({
        name: "სახლი #2",
        address: "ქ. თბილისი, უნივერსიტეტის ქუჩა",
      })
      .returning();
    project = p;
  }
  console.log(`Project: ${project.name} (id=${project.id})`);

  await seedFloors(project.id, areasRows);
  await seedBudget(
    project.id,
    budgetRows,
    matLookup,
    svcLookup,
    laborLookup,
  );

  await closeDb();
  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
