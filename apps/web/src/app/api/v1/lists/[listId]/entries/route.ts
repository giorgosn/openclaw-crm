import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, badRequest, notFound, success } from "@/lib/api-utils";
import { listListEntries, addListEntry, verifyListWorkspace } from "@/services/lists";

/** GET /api/v1/lists/[listId]/entries — List entries */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { listId } = await params;
  if (!(await verifyListWorkspace(listId, ctx.workspaceId))) {
    return notFound("List not found");
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") || 50), 200);
  const offset = Number(searchParams.get("offset") || 0);

  const result = await listListEntries(listId, { limit, offset });

  return success({
    entries: result.entries,
    pagination: { limit, offset, total: result.total },
  });
}

/** POST /api/v1/lists/[listId]/entries — Add a record to the list */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { listId } = await params;
  if (!(await verifyListWorkspace(listId, ctx.workspaceId))) {
    return notFound("List not found");
  }

  const body = await req.json();

  if (!body.recordId) {
    return badRequest("recordId is required");
  }

  const entry = await addListEntry(listId, body.recordId, ctx.userId, body.values);
  return success(entry, 201);
}
