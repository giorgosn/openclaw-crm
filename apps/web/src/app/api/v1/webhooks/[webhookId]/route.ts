import { NextRequest } from "next/server";
import {
  getAuthContext,
  unauthorized,
  notFound,
  badRequest,
  success,
  requireAdmin,
} from "@/lib/api-utils";
import { getWebhook, updateWebhook, deleteWebhook } from "@/services/webhooks";
import { WEBHOOK_EVENTS } from "@/db/schema/webhooks";

/** GET /api/v1/webhooks/[webhookId] — Get a webhook (secret included for settings UI) */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const adminCheck = requireAdmin(ctx);
  if (adminCheck) return adminCheck;

  const { webhookId } = await params;
  const hook = await getWebhook(webhookId, ctx.workspaceId);
  if (!hook) return notFound("Webhook not found");

  return success(hook);
}

/** PATCH /api/v1/webhooks/[webhookId] — Update a webhook */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const adminCheck = requireAdmin(ctx);
  if (adminCheck) return adminCheck;

  const { webhookId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const updates: Parameters<typeof updateWebhook>[2] = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string") return badRequest("name must be a string");
    updates.name = body.name.trim();
  }
  if (body.url !== undefined) {
    if (typeof body.url !== "string") return badRequest("url must be a string");
    if (!URL.canParse(body.url as string)) return badRequest("url must be a valid URL");
    updates.url = body.url.trim();
  }
  if (body.events !== undefined) {
    if (!Array.isArray(body.events)) return badRequest("events must be an array");
    const valid = new Set<string>([...WEBHOOK_EVENTS, "*"]);
    const invalid = (body.events as string[]).filter((e) => !valid.has(e));
    if (invalid.length > 0) return badRequest(`Unknown events: ${invalid.join(", ")}`);
    updates.events = body.events as string[];
  }
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") return badRequest("isActive must be a boolean");
    updates.isActive = body.isActive;
  }

  const hook = await updateWebhook(webhookId, ctx.workspaceId, updates);
  if (!hook) return notFound("Webhook not found");

  return success({ ...hook, secret: undefined });
}

/** DELETE /api/v1/webhooks/[webhookId] — Delete a webhook */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const adminCheck = requireAdmin(ctx);
  if (adminCheck) return adminCheck;

  const { webhookId } = await params;
  const deleted = await deleteWebhook(webhookId, ctx.workspaceId);
  if (!deleted) return notFound("Webhook not found");

  return success({ deleted: true });
}
