import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, success, badRequest } from "@/lib/api-utils";
import { listNotes, createNote } from "@/services/notes";

/** GET /api/v1/notes — All notes in workspace */
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") || 50), 200);
  const offset = Number(searchParams.get("offset") || 0);

  const result = await listNotes(ctx.workspaceId, { limit, offset });

  return success({
    notes: result.notes,
    pagination: { limit, offset, total: result.total },
  });
}

/** POST /api/v1/notes — Create a new note */
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const body = await req.json();
  const { recordId, title, content } = body;

  if (!recordId) {
    return badRequest("recordId is required");
  }

  const note = await createNote(
    recordId,
    title || "Untitled",
    content || null,
    ctx.userId
  );

  return success(note, 201);
}
