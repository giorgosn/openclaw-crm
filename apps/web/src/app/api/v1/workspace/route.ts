import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, success, badRequest } from "@/lib/api-utils";
import { getWorkspace, updateWorkspace } from "@/services/workspace";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const workspace = await getWorkspace(ctx.workspaceId);
  return success(workspace);
}

export async function PATCH(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  if (ctx.workspaceRole !== "admin") {
    return badRequest("Only admins can update workspace settings");
  }

  const body = await req.json();
  const updated = await updateWorkspace(ctx.workspaceId, body);
  return success(updated);
}
