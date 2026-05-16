import {
  pgTable,
  serial,
  integer,
  text,
  numeric,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const budgetKindEnum = pgEnum("budget_kind", [
  "material",
  "service",
  "labor",
]);

export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  defaultUnitPrice: numeric("default_unit_price", {
    precision: 14,
    scale: 4,
  }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  defaultUnitPrice: numeric("default_unit_price", {
    precision: 14,
    scale: 4,
  }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const laborItems = pgTable("labor_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  defaultUnitPrice: numeric("default_unit_price", {
    precision: 14,
    scale: 4,
  }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const floors = pgTable("floors", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  constructionArea: numeric("construction_area", { precision: 12, scale: 2 }),
  usableArea: numeric("usable_area", { precision: 12, scale: 2 }),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const segments = pgTable(
  "segments",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    code: text("code"),
    name: text("name").notNull(),
    parentSegmentId: integer("parent_segment_id"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("segments_project_idx").on(t.projectId)],
);

export const budgetItems = pgTable(
  "budget_items",
  {
    id: serial("id").primaryKey(),
    segmentId: integer("segment_id")
      .notNull()
      .references(() => segments.id, { onDelete: "cascade" }),
    kind: budgetKindEnum("kind").notNull(),
    materialId: integer("material_id").references(() => materials.id, {
      onDelete: "set null",
    }),
    serviceId: integer("service_id").references(() => services.id, {
      onDelete: "set null",
    }),
    laborId: integer("labor_id").references(() => laborItems.id, {
      onDelete: "set null",
    }),
    name: text("name"),
    unit: text("unit"),
    quantityPlanned: numeric("quantity_planned", {
      precision: 16,
      scale: 4,
    }).default("0"),
    unitPrice: numeric("unit_price", { precision: 14, scale: 4 }).default("0"),
  },
  (t) => [index("budget_items_segment_idx").on(t.segmentId)],
);

export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  supplier: text("supplier"),
  invoiceNo: text("invoice_no"),
  purchasedAt: timestamp("purchased_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const purchaseItems = pgTable(
  "purchase_items",
  {
    id: serial("id").primaryKey(),
    purchaseId: integer("purchase_id")
      .notNull()
      .references(() => purchases.id, { onDelete: "cascade" }),
    materialId: integer("material_id")
      .notNull()
      .references(() => materials.id),
    quantity: numeric("quantity", { precision: 16, scale: 4 }).notNull(),
    unitPrice: numeric("unit_price", { precision: 14, scale: 4 })
      .notNull()
      .default("0"),
  },
  (t) => [
    index("purchase_items_purchase_idx").on(t.purchaseId),
    index("purchase_items_material_idx").on(t.materialId),
  ],
);

export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  segmentId: integer("segment_id").references(() => segments.id, {
    onDelete: "set null",
  }),
  issuedAt: timestamp("issued_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  issuedBy: text("issued_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const issueItems = pgTable(
  "issue_items",
  {
    id: serial("id").primaryKey(),
    issueId: integer("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    materialId: integer("material_id")
      .notNull()
      .references(() => materials.id),
    quantity: numeric("quantity", { precision: 16, scale: 4 }).notNull(),
  },
  (t) => [
    index("issue_items_issue_idx").on(t.issueId),
    index("issue_items_material_idx").on(t.materialId),
  ],
);

export const audits = pgTable("audits", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  auditedAt: timestamp("audited_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const auditItems = pgTable(
  "audit_items",
  {
    id: serial("id").primaryKey(),
    auditId: integer("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "cascade" }),
    materialId: integer("material_id")
      .notNull()
      .references(() => materials.id),
    countedQuantity: numeric("counted_quantity", {
      precision: 16,
      scale: 4,
    }).notNull(),
    systemQuantity: numeric("system_quantity", {
      precision: 16,
      scale: 4,
    }).notNull(),
  },
  (t) => [index("audit_items_audit_idx").on(t.auditId)],
);

export const projectsRelations = relations(projects, ({ many }) => ({
  floors: many(floors),
  segments: many(segments),
  purchases: many(purchases),
  issues: many(issues),
  audits: many(audits),
}));

export const segmentsRelations = relations(segments, ({ one, many }) => ({
  project: one(projects, {
    fields: [segments.projectId],
    references: [projects.id],
  }),
  parent: one(segments, {
    fields: [segments.parentSegmentId],
    references: [segments.id],
    relationName: "segment_parent",
  }),
  children: many(segments, { relationName: "segment_parent" }),
  budgetItems: many(budgetItems),
}));

export const budgetItemsRelations = relations(budgetItems, ({ one }) => ({
  segment: one(segments, {
    fields: [budgetItems.segmentId],
    references: [segments.id],
  }),
  material: one(materials, {
    fields: [budgetItems.materialId],
    references: [materials.id],
  }),
  service: one(services, {
    fields: [budgetItems.serviceId],
    references: [services.id],
  }),
  labor: one(laborItems, {
    fields: [budgetItems.laborId],
    references: [laborItems.id],
  }),
}));

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  project: one(projects, {
    fields: [purchases.projectId],
    references: [projects.id],
  }),
  items: many(purchaseItems),
}));

export const purchaseItemsRelations = relations(purchaseItems, ({ one }) => ({
  purchase: one(purchases, {
    fields: [purchaseItems.purchaseId],
    references: [purchases.id],
  }),
  material: one(materials, {
    fields: [purchaseItems.materialId],
    references: [materials.id],
  }),
}));

export const issuesRelations = relations(issues, ({ one, many }) => ({
  project: one(projects, {
    fields: [issues.projectId],
    references: [projects.id],
  }),
  segment: one(segments, {
    fields: [issues.segmentId],
    references: [segments.id],
  }),
  items: many(issueItems),
}));

export const issueItemsRelations = relations(issueItems, ({ one }) => ({
  issue: one(issues, { fields: [issueItems.issueId], references: [issues.id] }),
  material: one(materials, {
    fields: [issueItems.materialId],
    references: [materials.id],
  }),
}));

export const auditsRelations = relations(audits, ({ one, many }) => ({
  project: one(projects, {
    fields: [audits.projectId],
    references: [projects.id],
  }),
  items: many(auditItems),
}));

export const auditItemsRelations = relations(auditItems, ({ one }) => ({
  audit: one(audits, { fields: [auditItems.auditId], references: [audits.id] }),
  material: one(materials, {
    fields: [auditItems.materialId],
    references: [materials.id],
  }),
}));
