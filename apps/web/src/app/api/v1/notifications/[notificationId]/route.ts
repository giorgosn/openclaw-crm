import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, notFound, success } from "@/lib/api-utils";
import { markAsRead } from "@/services/notifications";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { notificationId } = await params;
  const updated = await markAsRead(notificationId, ctx.userId);
  if (!updated) return notFound("Notification not found");

  return success(updated);
}
