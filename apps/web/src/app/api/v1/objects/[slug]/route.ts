import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, notFound, badRequest, success, requireAdmin } from "@/lib/api-utils";
import { getObjectWithAttributes, updateObject, deleteObject } from "@/services/objects";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { slug } = await params;
  const obj = await getObjectWithAttributes(ctx.workspaceId, slug);
  if (!obj) return notFound("Object not found");

  return success(obj);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { slug } = await params;
  const body = await req.json();

  const updated = await updateObject(ctx.workspaceId, slug, body);
  if (!updated) return notFound("Object not found");

  return success(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();
  const adminCheck = requireAdmin(ctx);
  if (adminCheck) return adminCheck;

  const { slug } = await params;

  try {
    const deleted = await deleteObject(ctx.workspaceId, slug);
    if (!deleted) return notFound("Object not found");
    return success(deleted);
  } catch (e: any) {
    if (e.message === "Cannot delete system objects") {
      return badRequest(e.message);
    }
    throw e;
  }
}
