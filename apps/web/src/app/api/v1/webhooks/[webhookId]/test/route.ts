import { NextRequest } from "next/server";
import {
  getAuthContext,
  unauthorized,
  notFound,
  success,
  requireAdmin,
} from "@/lib/api-utils";
import { sendTestPing } from "@/services/webhooks";

/** POST /api/v1/webhooks/[webhookId]/test — Send a test ping */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const adminCheck = requireAdmin(ctx);
  if (adminCheck) return adminCheck;

  const { webhookId } = await params;
  const result = await sendTestPing(webhookId, ctx.workspaceId);

  if (result.responseBody === "Webhook not found") return notFound("Webhook not found");

  return success(result);
}
