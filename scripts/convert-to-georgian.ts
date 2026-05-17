import "dotenv/config";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.DATABASE_URL!;

const MAP: Record<string, string> = {
  a: "ა", b: "ბ", g: "გ", d: "დ", e: "ე", v: "ვ", z: "ზ",
  T: "თ", i: "ი", k: "კ", l: "ლ", m: "მ", n: "ნ", o: "ო",
  p: "პ", J: "ჯ", r: "რ", s: "ს", t: "ტ", u: "უ", f: "ფ",
  q: "ქ", R: "ღ", y: "ყ", S: "შ", C: "ჩ", c: "ც", Z: "ძ",
  w: "წ", W: "ჭ", x: "ხ", j: "ჟ", h: "ჰ",
};

function toGeorgian(text: string): string {
  return text.split("").map((ch) => MAP[ch] ?? ch).join("");
}

async function main() {
  if (!url.startsWith("pglite://")) {
    console.error("Only pglite:// supported in this script");
    process.exit(1);
  }

  const dataDir = url.replace(/^pglite:\/\//, "");
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite(dataDir);

  const tables: { table: string; cols: string[] }[] = [
    { table: "materials",   cols: ["name", "unit", "notes"] },
    { table: "services",    cols: ["name", "unit", "notes"] },
    { table: "labor_items", cols: ["name", "unit"] },
    { table: "segments",    cols: ["name"] },
    { table: "budget_items", cols: ["name", "unit"] },
    { table: "floors",      cols: ["label"] },
  ];

  console.log("Converting transliterated text to Georgian…");

  for (const { table, cols } of tables) {
    const res = await db.query(
      `SELECT id, ${cols.join(", ")} FROM "${table}"`,
      [],
      { rowMode: "object" },
    );

    let count = 0;
    for (const row of res.rows as any[]) {
      for (const col of cols) {
        const val = row[col];
        if (!val) continue;
        const converted = toGeorgian(String(val));
        if (converted === val) continue;
        await db.query(
          `UPDATE "${table}" SET "${col}" = $1 WHERE id = $2`,
          [converted, row.id],
        );
        count++;
      }
    }
    console.log(`  ${table}: ${count} field(s) updated`);
  }

  await db.close();
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
