import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, notFound, success } from "@/lib/api-utils";
import { removeListEntry, updateEntryValues, verifyListWorkspace } from "@/services/lists";

/** PATCH /api/v1/lists/[listId]/entries/[entryId] — Update entry values */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ listId: string; entryId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { listId, entryId } = await params;
  if (!(await verifyListWorkspace(listId, ctx.workspaceId))) {
    return notFound("List not found");
  }

  const body = await req.json();

  if (body.values) {
    await updateEntryValues(entryId, listId, body.values, ctx.userId);
  }

  return success({ updated: true });
}

/** DELETE /api/v1/lists/[listId]/entries/[entryId] — Remove entry from list */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ listId: string; entryId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { listId } = await params;
  if (!(await verifyListWorkspace(listId, ctx.workspaceId))) {
    return notFound("List not found");
  }

  const { entryId } = await params;
  const entry = await removeListEntry(entryId);
  if (!entry) return notFound("Entry not found");

  return success({ deleted: true });
}
