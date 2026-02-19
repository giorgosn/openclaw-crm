import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, badRequest, success } from "@/lib/api-utils";
import { listObjects, createObject } from "@/services/objects";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const data = await listObjects(ctx.workspaceId);
  return success(data);
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const body = await req.json();
  const { slug, singularName, pluralName, icon } = body;

  if (!slug || !singularName || !pluralName) {
    return badRequest("slug, singularName, and pluralName are required");
  }

  try {
    const obj = await createObject(ctx.workspaceId, { slug, singularName, pluralName, icon });
    return success(obj, 201);
  } catch (e: any) {
    if (e.code === "23505") {
      return badRequest("An object with this slug already exists");
    }
    throw e;
  }
}
