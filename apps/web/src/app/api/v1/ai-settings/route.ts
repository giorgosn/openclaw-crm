import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, requireAdmin, success, badRequest } from "@/lib/api-utils";
import { db } from "@/db";
import { workspaces } from "@/db/schema";
import { eq } from "drizzle-orm";

interface WorkspaceSettings {
  openrouterApiKey?: string;
  openrouterModel?: string;
}

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const [workspace] = await db
    .select({ settings: workspaces.settings })
    .from(workspaces)
    .where(eq(workspaces.id, ctx.workspaceId))
    .limit(1);

  const settings = (workspace?.settings ?? {}) as WorkspaceSettings;

  return success({
    model: settings.openrouterModel || "anthropic/claude-sonnet-4",
    hasApiKey: !!settings.openrouterApiKey,
  });
}

export async function PATCH(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const adminCheck = requireAdmin(ctx);
  if (adminCheck) return adminCheck;

  const body = await req.json();
  const { apiKey, model } = body as { apiKey?: string; model?: string };

  if (!apiKey && !model) {
    return badRequest("Provide apiKey or model");
  }

  const [workspace] = await db
    .select({ settings: workspaces.settings })
    .from(workspaces)
    .where(eq(workspaces.id, ctx.workspaceId))
    .limit(1);

  const current = (workspace?.settings ?? {}) as WorkspaceSettings;
  const updated: WorkspaceSettings = { ...current };

  if (apiKey !== undefined) updated.openrouterApiKey = apiKey;
  if (model !== undefined) updated.openrouterModel = model;

  await db
    .update(workspaces)
    .set({ settings: updated, updatedAt: new Date() })
    .where(eq(workspaces.id, ctx.workspaceId));

  return success({
    model: updated.openrouterModel || "anthropic/claude-sonnet-4",
    hasApiKey: !!updated.openrouterApiKey,
  });
}
