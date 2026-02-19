import { pgTable, text, timestamp, jsonb, pgEnum, index } from "drizzle-orm/pg-core";
import { workspaces } from "./workspace";
import { users } from "./auth";

export const messageRoleEnum = pgEnum("message_role", [
  "user",
  "assistant",
  "system",
  "tool",
]);

export const conversations = pgTable(
  "conversations",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New conversation"),
    model: text("model").notNull().default("anthropic/claude-sonnet-4"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("conversations_user_id").on(table.userId),
    index("conversations_workspace_id").on(table.workspaceId),
  ]
);

export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: messageRoleEnum("role").notNull(),
    content: text("content"),
    toolCalls: jsonb("tool_calls"), // Raw OpenRouter tool_calls array
    toolCallId: text("tool_call_id"), // For tool result messages
    toolName: text("tool_name"),
    metadata: jsonb("metadata"), // confirmation status, etc.
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("messages_conversation_id").on(table.conversationId),
  ]
);
