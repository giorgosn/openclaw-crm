import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, notFound, success } from "@/lib/api-utils";
import { getObjectBySlug } from "@/services/objects";
import { getTasksForRecord } from "@/services/tasks";
import { getRecord } from "@/services/records";

/** GET /api/v1/objects/[slug]/records/[recordId]/tasks */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; recordId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { slug, recordId } = await params;
  const obj = await getObjectBySlug(ctx.workspaceId, slug);
  if (!obj) return notFound("Object not found");

  const record = await getRecord(obj.id, recordId);
  if (!record) return notFound("Record not found");

  const tasks = await getTasksForRecord(recordId);
  return success(tasks);
}
