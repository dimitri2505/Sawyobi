# საწყობი — Sawyobi

Warehouse management for the construction project **სახლი #2** (Tbilisi, University St.). Tracks material purchases, balance, audits, segment/project allocation, outflows, and remaining stock against the imported budget.

Built on Next.js 16 (App Router) + React 19 + Tailwind v4 + Neon Postgres + Drizzle ORM. Server-rendered with Server Actions for mutations. UI is in Georgian.

## Setup (any laptop, no install)

The app supports two databases: **PGlite** (in-process Postgres, zero install — recommended for local) and **Neon Postgres** (for production / shared cloud).

```bash
# 1. clone & install
git clone https://github.com/dimitri2505/Sawyobi.git
cd Sawyobi
git checkout nika-giorgadze
npm install

# 2. configure env (PGlite default — no DB to install)
cp .env.example .env.local
# .env.local already has: DATABASE_URL=pglite://./data/pgdata

# 3. apply schema + seed budget Excel
npm run db:migrate
npm run db:seed

# 4. run
npm run dev
# open http://localhost:3000
```

The data lives in `./data/pgdata/` (ignored by git, local to each machine). Seed source: `data/budget.xlsx` (committed).

### Switching to Neon Postgres (optional)

If you want a shared cloud DB across laptops:

1. Create a project at [neon.tech](https://neon.tech) (or via Vercel → Storage → Neon)
2. Replace `DATABASE_URL` in `.env.local` with the Neon connection string (must start with `postgres://` or `postgresql://`)
3. Re-run `npm run db:migrate && npm run db:seed`

   This populates:
   - Material / service / labor catalogs
   - Project `სახლი #2` with floors
   - Segment hierarchy (კონსტრუქციული ნაწილი → რკ/ბეტონის კარკასი → საძირკველი → …)
   - Budget items (planned quantity + unit price per leaf row)

6. **Run the app**

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000>.

## Data model

| Table             | Purpose                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `materials`       | Material catalog (name, unit, default unit price)                    |
| `services`        | Service catalog                                                      |
| `labor_items`     | Labor catalog                                                        |
| `projects`        | Top-level construction project                                       |
| `floors`          | Floor list per project (with construction / usable area)             |
| `segments`        | Hierarchical work breakdown (parent_segment_id forms a tree)         |
| `budget_items`    | Planned line items per segment (kind = material / service / labor)   |
| `purchases`       | Purchase header (supplier, invoice, date, project)                   |
| `purchase_items`  | Purchase lines (material, qty, unit price)                           |
| `issues`          | Outflow header (project + segment + date)                            |
| `issue_items`     | Outflow lines (material, qty)                                        |
| `audits`          | Audit / revision header                                              |
| `audit_items`     | Counted vs system per material — variance = counted − system         |
| `v_stock`         | Postgres view: per-material `purchased − issued ± audit_adjustments` |

Stock balance per material is computed by `v_stock`.

## Routes

| Path                      | Page                                              |
| ------------------------- | ------------------------------------------------- |
| `/`                       | დაფა — KPIs + recent operations                   |
| `/balance`                | საწყობის ბალანსი (planned/purchased/issued/remaining) |
| `/purchases`              | შეძენები                                          |
| `/purchases/new`          | ახალი შეძენა                                      |
| `/purchases/[id]`         | შეძენის დეტალები                                  |
| `/issues`                 | გატანები                                          |
| `/issues/new`             | გატანა საწყობიდან                                 |
| `/issues/[id]`            | გატანის დეტალები                                  |
| `/audits`                 | რევიზია                                           |
| `/audits/new`             | ახალი რევიზია                                     |
| `/budget`                 | ბიუჯეტი (სეგმენტების ხე)                         |
| `/catalog/materials`      | მასალები                                          |
| `/catalog/services`       | მომსახურება                                       |
| `/catalog/labor`          | ხელფასები                                         |

## Scripts

| Command                | What it does                       |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | Dev server                         |
| `npm run build`        | Production build                   |
| `npm run start`        | Start production build             |
| `npm run lint`         | ESLint                             |
| `npm run typecheck`    | `tsc --noEmit`                     |
| `npm run format`       | Prettier write                     |
| `npm run db:generate`  | Generate Drizzle migration files   |
| `npm run db:migrate`   | Apply migrations to Neon           |
| `npm run db:push`      | Push schema directly (dev only)    |
| `npm run db:seed`      | Seed catalogs and budget from xlsx |
| `npm run db:studio`    | Drizzle Studio                     |
