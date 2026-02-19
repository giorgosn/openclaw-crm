import { pgTable, text, timestamp, numeric, date, boolean, jsonb, integer, index } from "drizzle-orm/pg-core";
import { objects, attributes } from "./objects";
import { users } from "./auth";

export const records = pgTable(
  "records",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    objectId: text("object_id")
      .notNull()
      .references(() => objects.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    index("records_object_id").on(table.objectId),
  ]
);

export const recordValues = pgTable(
  "record_values",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    recordId: text("record_id")
      .notNull()
      .references(() => records.id, { onDelete: "cascade" }),
    attributeId: text("attribute_id")
      .notNull()
      .references(() => attributes.id, { onDelete: "cascade" }),
    // Typed value columns - only one is used per row based on attribute type
    textValue: text("text_value"),
    numberValue: numeric("number_value"),
    dateValue: date("date_value"),
    timestampValue: timestamp("timestamp_value"),
    booleanValue: boolean("boolean_value"),
    jsonValue: jsonb("json_value"),
    referencedRecordId: text("referenced_record_id").references(() => records.id, { onDelete: "set null" }),
    actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
    // Sort order for multiselect values
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  },
  (table) => [
    index("record_values_record_id").on(table.recordId),
    index("record_values_record_attribute").on(table.recordId, table.attributeId),
    index("record_values_attribute_text").on(table.attributeId, table.textValue),
    index("record_values_attribute_number").on(table.attributeId, table.numberValue),
    index("record_values_attribute_date").on(table.attributeId, table.dateValue),
    index("record_values_attribute_boolean").on(table.attributeId, table.booleanValue),
    index("record_values_referenced_record").on(table.referencedRecordId),
  ]
);
