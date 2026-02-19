import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, notFound, success } from "@/lib/api-utils";
import { getObjectBySlug } from "@/services/objects";
import { getRecord } from "@/services/records";
import { getNotesForRecord, createNote } from "@/services/notes";

/** GET /api/v1/objects/[slug]/records/[recordId]/notes */
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

  const notes = await getNotesForRecord(recordId);
  return success(notes);
}

/** POST /api/v1/objects/[slug]/records/[recordId]/notes */
export async function POST(
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

  const body = await req.json();

  const note = await createNote(
    recordId,
    body.title || "",
    body.content || null,
    ctx.userId
  );

  return success(note, 201);
}
