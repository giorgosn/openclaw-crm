import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, notFound, success } from "@/lib/api-utils";
import { getList, updateList, deleteList, verifyListWorkspace } from "@/services/lists";

/** GET /api/v1/lists/[listId] — Get list details */
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

  const list = await getList(listId);
  if (!list) return notFound("List not found");

  return success(list);
}

/** PATCH /api/v1/lists/[listId] — Update list */
export async function PATCH(
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
  const list = await updateList(listId, body);
  if (!list) return notFound("List not found");

  return success(list);
}

/** DELETE /api/v1/lists/[listId] — Delete list */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { listId } = await params;
  if (!(await verifyListWorkspace(listId, ctx.workspaceId))) {
    return notFound("List not found");
  }

  const list = await deleteList(listId);
  if (!list) return notFound("List not found");

  return success({ deleted: true });
}
