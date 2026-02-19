import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, badRequest, success } from "@/lib/api-utils";
import { listLists, createList } from "@/services/lists";
import { getObjectBySlug } from "@/services/objects";

/** GET /api/v1/lists — List all lists in workspace */
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const result = await listLists(ctx.workspaceId);
  return success(result);
}

/** POST /api/v1/lists — Create a new list */
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const body = await req.json();
  const { name, objectSlug, isPrivate } = body;

  if (!name || !objectSlug) {
    return badRequest("name and objectSlug are required");
  }

  const obj = await getObjectBySlug(ctx.workspaceId, objectSlug);
  if (!obj) return badRequest("Object not found");

  const list = await createList(obj.id, name, ctx.userId, isPrivate);
  return success(list, 201);
}
