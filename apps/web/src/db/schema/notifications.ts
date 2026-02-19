import { pgTable, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { workspaces } from "./workspace";

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // e.g. "member_added", "record_created", "task_assigned"
  title: text("title").notNull(),
  body: text("body"),
  url: text("url"), // link to navigate to
  isRead: boolean("is_read").notNull().default(false),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
