import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { records } from "./records";
import { users } from "./auth";
import { workspaces } from "./workspace";

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  content: text("content").notNull(),
  deadline: timestamp("deadline"),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("tasks_workspace_id").on(table.workspaceId),
]);

export const taskRecords = pgTable(
  "task_records",
  {
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    recordId: text("record_id")
      .notNull()
      .references(() => records.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("task_records_task_id").on(table.taskId),
    index("task_records_record_id").on(table.recordId),
  ]
);

export const taskAssignees = pgTable(
  "task_assignees",
  {
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("task_assignees_task_id").on(table.taskId),
    index("task_assignees_user_id").on(table.userId),
  ]
);
