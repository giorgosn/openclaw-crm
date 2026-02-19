import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, success } from "@/lib/api-utils";
import { listNotifications, getUnreadCount } from "@/services/notifications";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const unreadOnly = req.nextUrl.searchParams.get("unreadOnly") === "true";
  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get("limit") ?? "30", 10),
    100
  );

  const [items, unreadCount] = await Promise.all([
    listNotifications(ctx.workspaceId, ctx.userId, { limit, unreadOnly }),
    getUnreadCount(ctx.workspaceId, ctx.userId),
  ]);

  return success({ notifications: items, unreadCount });
}
