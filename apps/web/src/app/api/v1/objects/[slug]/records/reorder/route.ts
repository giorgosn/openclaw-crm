import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, notFound, badRequest, success } from "@/lib/api-utils";
import { getObjectBySlug } from "@/services/objects";
import { reorderRecords } from "@/services/records";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { slug } = await params;
  const obj = await getObjectBySlug(ctx.workspaceId, slug);
  if (!obj) return notFound("Object not found");

  const body = await req.json();
  const { recordIds } = body;

  if (!Array.isArray(recordIds) || recordIds.length === 0) {
    return badRequest("recordIds array is required");
  }

  await reorderRecords(obj.id, recordIds);
  return success({ ok: true });
}
