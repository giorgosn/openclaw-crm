import { pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { records } from "./records";
import { users } from "./auth";

export const notes = pgTable(
  "notes",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    recordId: text("record_id")
      .notNull()
      .references(() => records.id, { onDelete: "cascade" }),
    title: text("title").notNull().default(""),
    content: jsonb("content"), // TipTap JSON format
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("notes_record_id").on(table.recordId),
  ]
);
