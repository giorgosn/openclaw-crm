import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, notFound, success } from "@/lib/api-utils";
import { getList, getAvailableRecords, verifyListWorkspace } from "@/services/lists";

/** GET /api/v1/lists/[listId]/available-records — Records not yet in this list */
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

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;

  const records = await getAvailableRecords(listId, list.objectId, search);
  return success(records);
}
