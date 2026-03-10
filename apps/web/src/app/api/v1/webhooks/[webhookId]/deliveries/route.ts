import { NextRequest } from "next/server";
import {
  getAuthContext,
  unauthorized,
  success,
  requireAdmin,
} from "@/lib/api-utils";
import { listDeliveries } from "@/services/webhooks";

/** GET /api/v1/webhooks/[webhookId]/deliveries — List recent deliveries */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const adminCheck = requireAdmin(ctx);
  if (adminCheck) return adminCheck;

  const { webhookId } = await params;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") || 50), 200);

  const deliveries = await listDeliveries(webhookId, ctx.workspaceId, limit);
  return success({ deliveries });
}
