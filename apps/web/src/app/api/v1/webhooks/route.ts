import { NextRequest } from "next/server";
import {
  getAuthContext,
  unauthorized,
  badRequest,
  success,
  requireAdmin,
} from "@/lib/api-utils";
import { listWebhooks, createWebhook } from "@/services/webhooks";
import { WEBHOOK_EVENTS } from "@/db/schema/webhooks";

/** GET /api/v1/webhooks — List all webhooks for workspace */
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const adminCheck = requireAdmin(ctx);
  if (adminCheck) return adminCheck;

  const hooks = await listWebhooks(ctx.workspaceId);
  // Never expose the secret in list responses
  return success({
    webhooks: hooks.map(({ secret: _secret, ...h }) => h),
  });
}

/** POST /api/v1/webhooks — Create a new webhook (admin only) */
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const adminCheck = requireAdmin(ctx);
  if (adminCheck) return adminCheck;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const { name, url, events } = body;

  if (!name || typeof name !== "string") return badRequest("name is required");
  if (!url || typeof url !== "string") return badRequest("url is required");
  if (!URL.canParse(url)) return badRequest("url must be a valid URL");

  // Default to all events if not specified; validate any provided event names
  let eventList: string[] = ["*"];
  if (Array.isArray(events) && events.length > 0) {
    const valid = new Set<string>([...WEBHOOK_EVENTS, "*"]);
    const invalid = (events as string[]).filter((e) => !valid.has(e));
    if (invalid.length > 0) {
      return badRequest(`Unknown events: ${invalid.join(", ")}`);
    }
    eventList = events as string[];
  }

  const hook = await createWebhook(ctx.workspaceId, {
    name: name.trim(),
    url: url.trim(),
    events: eventList,
  });

  // Return the secret in plaintext once, at creation time only
  return success(hook, 201);
}
