import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export async function listNotifications(
  workspaceId: string,
  userId: string,
  options: { limit?: number; unreadOnly?: boolean } = {}
) {
  const { limit = 30, unreadOnly = false } = options;

  const where = unreadOnly
    ? and(
        eq(notifications.workspaceId, workspaceId),
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    : and(
        eq(notifications.workspaceId, workspaceId),
        eq(notifications.userId, userId)
      );

  return db
    .select()
    .from(notifications)
    .where(where)
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadCount(workspaceId: string, userId: string) {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(
      and(
        eq(notifications.workspaceId, workspaceId),
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    );
  return Number(result.count);
}

export async function createNotification(input: {
  workspaceId: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  url?: string;
  metadata?: Record<string, unknown>;
}) {
  const [notif] = await db
    .insert(notifications)
    .values(input)
    .returning();
  return notif;
}

export async function markAsRead(notificationId: string, userId: string) {
  const [updated] = await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(eq(notifications.id, notificationId), eq(notifications.userId, userId))
    )
    .returning();
  return updated ?? null;
}

export async function markAllAsRead(workspaceId: string, userId: string) {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.workspaceId, workspaceId),
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    );
}
