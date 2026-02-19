import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, notFound, success } from "@/lib/api-utils";
import { getNote, updateNote, deleteNote, verifyNoteWorkspace } from "@/services/notes";

/** GET /api/v1/notes/[noteId] */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { noteId } = await params;
  if (!(await verifyNoteWorkspace(noteId, ctx.workspaceId))) {
    return notFound("Note not found");
  }

  const note = await getNote(noteId);
  if (!note) return notFound("Note not found");

  return success(note);
}

/** PATCH /api/v1/notes/[noteId] */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { noteId } = await params;
  if (!(await verifyNoteWorkspace(noteId, ctx.workspaceId))) {
    return notFound("Note not found");
  }

  const body = await req.json();
  const note = await updateNote(noteId, body);
  if (!note) return notFound("Note not found");

  return success(note);
}

/** DELETE /api/v1/notes/[noteId] */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { noteId } = await params;
  if (!(await verifyNoteWorkspace(noteId, ctx.workspaceId))) {
    return notFound("Note not found");
  }

  const note = await deleteNote(noteId);
  if (!note) return notFound("Note not found");

  return success({ deleted: true });
}
