import { pgTable, text, timestamp, boolean, integer, jsonb, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { workspaces } from "./workspace";

export const attributeTypeEnum = pgEnum("attribute_type", [
  "text",
  "number",
  "currency",
  "date",
  "timestamp",
  "checkbox",
  "select",
  "status",
  "rating",
  "email_address",
  "phone_number",
  "domain",
  "location",
  "personal_name",
  "record_reference",
  "actor_reference",
  "interaction",
]);

export const objects = pgTable(
  "objects",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    singularName: text("singular_name").notNull(),
    pluralName: text("plural_name").notNull(),
    icon: text("icon").notNull().default("box"),
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("objects_workspace_slug").on(table.workspaceId, table.slug),
  ]
);

export const attributes = pgTable(
  "attributes",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    objectId: text("object_id")
      .notNull()
      .references(() => objects.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    type: attributeTypeEnum("type").notNull(),
    config: jsonb("config").default({}),
    isSystem: boolean("is_system").notNull().default(false),
    isRequired: boolean("is_required").notNull().default(false),
    isUnique: boolean("is_unique").notNull().default(false),
    isMultiselect: boolean("is_multiselect").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("attributes_object_slug").on(table.objectId, table.slug),
  ]
);

export const selectOptions = pgTable("select_options", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  attributeId: text("attribute_id")
    .notNull()
    .references(() => attributes.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  color: text("color").notNull().default("#6366f1"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const statuses = pgTable("statuses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  attributeId: text("attribute_id")
    .notNull()
    .references(() => attributes.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  color: text("color").notNull().default("#6366f1"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  celebrationEnabled: boolean("celebration_enabled").notNull().default(false),
});
