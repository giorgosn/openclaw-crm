import { pgTable, text, timestamp, boolean, integer, index } from "drizzle-orm/pg-core";
import { workspaces } from "./workspace";

export const WEBHOOK_EVENTS = [
  "record.created",
  "record.updated",
  "record.deleted",
  "task.created",
  "task.updated",
  "task.completed",
  "task.deleted",
  "note.created",
  "note.deleted",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export const webhooks = pgTable(
  "webhooks",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    url: text("url").notNull(),
    // JSON array of WebhookEvent strings, e.g. '["record.created","task.completed"]'
    events: text("events").notNull().default('["*"]'),
    // Plaintext secret used to sign payloads with HMAC-SHA256
    secret: text("secret").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("webhooks_workspace_id").on(table.workspaceId),
  ]
);

export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    webhookId: text("webhook_id")
      .notNull()
      .references(() => webhooks.id, { onDelete: "cascade" }),
    event: text("event").notNull(),
    // Full JSON payload sent to the endpoint
    payload: text("payload").notNull(),
    status: text("status").notNull().default("pending"), // "pending" | "success" | "failed"
    responseStatus: integer("response_status"),
    responseBody: text("response_body"),
    attempts: integer("attempts").notNull().default(1),
    deliveredAt: timestamp("delivered_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("webhook_deliveries_webhook_id").on(table.webhookId),
    index("webhook_deliveries_created_at").on(table.createdAt),
  ]
);
