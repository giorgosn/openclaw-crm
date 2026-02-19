import { pgTable, text, timestamp, boolean, integer, jsonb, index } from "drizzle-orm/pg-core";
import { objects, attributeTypeEnum } from "./objects";
import { records } from "./records";
import { users } from "./auth";

export const lists = pgTable("lists", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  objectId: text("object_id")
    .notNull()
    .references(() => objects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  isPrivate: boolean("is_private").notNull().default(false),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const listAttributes = pgTable("list_attributes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  listId: text("list_id")
    .notNull()
    .references(() => lists.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  type: attributeTypeEnum("type").notNull(),
  config: jsonb("config").default({}),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const listEntries = pgTable(
  "list_entries",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    listId: text("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    recordId: text("record_id")
      .notNull()
      .references(() => records.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  },
  (table) => [
    index("list_entries_list_record").on(table.listId, table.recordId),
  ]
);

export const listEntryValues = pgTable(
  "list_entry_values",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    entryId: text("entry_id")
      .notNull()
      .references(() => listEntries.id, { onDelete: "cascade" }),
    listAttributeId: text("list_attribute_id")
      .notNull()
      .references(() => listAttributes.id, { onDelete: "cascade" }),
    textValue: text("text_value"),
    numberValue: text("number_value"),
    dateValue: text("date_value"),
    timestampValue: timestamp("timestamp_value"),
    booleanValue: boolean("boolean_value"),
    jsonValue: jsonb("json_value"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  },
  (table) => [
    index("list_entry_values_entry_attr").on(table.entryId, table.listAttributeId),
  ]
);
